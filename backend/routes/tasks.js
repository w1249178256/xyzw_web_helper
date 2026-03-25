'use strict';

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database');
const { requireAuth } = require('../middleware/auth');
const { executeScheduledTask } = require('../game/executor');

const router = express.Router();

// -------------------------
// GET /api/auth/tasks
// List all scheduled tasks for the authenticated user
// -------------------------
router.get('/tasks', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const tasks = db
      .prepare('SELECT * FROM scheduled_tasks WHERE user_id = ? ORDER BY created_at DESC')
      .all(req.user.id);
    res.json({ tasks });
  } catch (err) {
    console.error('[Tasks] List error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// -------------------------
// POST /api/auth/tasks
// Create a new scheduled task
// -------------------------
router.post('/tasks', requireAuth, (req, res) => {
  try {
    const {
      name,
      run_type,
      run_time,
      cron_expression,
      interval_minutes,
      selected_token_ids,
      selected_tasks,
      enabled,
      time_window,
      task_params,
    } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'name is required' });
    }

    if (!run_type || !['daily', 'cron', 'interval'].includes(run_type)) {
      return res.status(400).json({ error: 'run_type must be "daily", "cron", or "interval"' });
    }

    if (run_type === 'daily' && !run_time) {
      return res.status(400).json({ error: 'run_time is required for daily tasks (HH:mm format)' });
    }

    if (run_type === 'cron' && !cron_expression) {
      return res.status(400).json({ error: 'cron_expression is required for cron tasks' });
    }

    if (run_type === 'interval' && (!interval_minutes || interval_minutes < 1)) {
      return res.status(400).json({ error: 'interval_minutes is required for interval tasks (>= 1)' });
    }

    const db = getDb();
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO scheduled_tasks
        (id, user_id, name, run_type, run_time, cron_expression, interval_minutes,
         selected_token_ids, selected_tasks, enabled, time_window, task_params, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      req.user.id,
      name.trim(),
      run_type,
      run_time || null,
      cron_expression || null,
      run_type === 'interval' ? parseInt(interval_minutes, 10) : null,
      JSON.stringify(Array.isArray(selected_token_ids) ? selected_token_ids : []),
      JSON.stringify(Array.isArray(selected_tasks) ? selected_tasks : []),
      enabled !== false ? 1 : 0,
      time_window ? JSON.stringify(time_window) : null,
      task_params ? JSON.stringify(task_params) : '{}',
      now,
      now,
    );

    const created = db.prepare('SELECT * FROM scheduled_tasks WHERE id = ?').get(id);
    res.status(201).json({ task: created });
  } catch (err) {
    console.error('[Tasks] Create error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// -------------------------
// PUT /api/auth/tasks/:id
// Update a scheduled task
// -------------------------
router.put('/tasks/:id', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const existing = db
      .prepare('SELECT * FROM scheduled_tasks WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user.id);

    if (!existing) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const {
      name,
      run_type,
      run_time,
      cron_expression,
      interval_minutes,
      selected_token_ids,
      selected_tasks,
      enabled,
      time_window,
      task_params,
    } = req.body;

    const updatedName = name !== undefined ? name.trim() : existing.name;
    const updatedRunType = run_type !== undefined ? run_type : existing.run_type;
    const updatedRunTime = run_time !== undefined ? run_time : existing.run_time;
    const updatedCron = cron_expression !== undefined ? cron_expression : existing.cron_expression;
    const updatedIntervalMinutes =
      interval_minutes !== undefined
        ? parseInt(interval_minutes, 10) || null
        : existing.interval_minutes;
    const updatedTokenIds =
      selected_token_ids !== undefined
        ? JSON.stringify(Array.isArray(selected_token_ids) ? selected_token_ids : [])
        : existing.selected_token_ids;
    const updatedTasks =
      selected_tasks !== undefined
        ? JSON.stringify(Array.isArray(selected_tasks) ? selected_tasks : [])
        : existing.selected_tasks;
    const updatedEnabled = enabled !== undefined ? (enabled ? 1 : 0) : existing.enabled;
    const updatedTimeWindow =
      time_window !== undefined
        ? time_window !== null
          ? JSON.stringify(time_window)
          : null
        : existing.time_window;
    const updatedTaskParams =
      task_params !== undefined ? JSON.stringify(task_params) : existing.task_params;
    const now = new Date().toISOString();

    db.prepare(
      `UPDATE scheduled_tasks SET
        name = ?, run_type = ?, run_time = ?, cron_expression = ?, interval_minutes = ?,
        selected_token_ids = ?, selected_tasks = ?, enabled = ?,
        time_window = ?, task_params = ?, updated_at = ?
       WHERE id = ? AND user_id = ?`,
    ).run(
      updatedName,
      updatedRunType,
      updatedRunTime,
      updatedCron,
      updatedIntervalMinutes,
      updatedTokenIds,
      updatedTasks,
      updatedEnabled,
      updatedTimeWindow,
      updatedTaskParams,
      now,
      req.params.id,
      req.user.id,
    );

    const updated = db.prepare('SELECT * FROM scheduled_tasks WHERE id = ?').get(req.params.id);
    res.json({ task: updated });
  } catch (err) {
    console.error('[Tasks] Update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// -------------------------
// DELETE /api/auth/tasks/:id
// Delete a scheduled task
// -------------------------
router.delete('/tasks/:id', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const existing = db
      .prepare('SELECT id FROM scheduled_tasks WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user.id);

    if (!existing) {
      return res.status(404).json({ error: 'Task not found' });
    }

    db.prepare('DELETE FROM scheduled_tasks WHERE id = ? AND user_id = ?').run(
      req.params.id,
      req.user.id,
    );

    res.json({ ok: true });
  } catch (err) {
    console.error('[Tasks] Delete error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// -------------------------
// GET /api/auth/tasks/logs
// Get recent task execution logs (last 50) for this user
// -------------------------
router.get('/tasks/logs', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const logs = db
      .prepare(
        `SELECT tl.*, st.name as task_name
         FROM task_logs tl
         LEFT JOIN scheduled_tasks st ON tl.task_id = st.id
         WHERE tl.user_id = ?
         ORDER BY tl.started_at DESC
         LIMIT 50`,
      )
      .all(req.user.id);
    res.json({ logs });
  } catch (err) {
    console.error('[Tasks] Logs error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// -------------------------
// POST /api/auth/tasks/:id/run
// Manually trigger a task immediately
// -------------------------
router.post('/tasks/:id/run', requireAuth, async (req, res) => {
  try {
    const db = getDb();
    const task = db
      .prepare('SELECT * FROM scheduled_tasks WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user.id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Fetch user tokens and settings
    const tokenRow = db
      .prepare('SELECT tokens_json FROM game_tokens WHERE user_id = ?')
      .get(req.user.id);
    const settingsRow = db
      .prepare('SELECT settings_json FROM user_settings WHERE user_id = ?')
      .get(req.user.id);
    const userTokens = tokenRow ? JSON.parse(tokenRow.tokens_json || '[]') : [];
    const batchSettings = settingsRow ? JSON.parse(settingsRow.settings_json || '{}') : {};

    // Create log entry
    const logEntries = [];
    const now = new Date().toISOString();
    const { lastInsertRowid: logId } = db
      .prepare(
        'INSERT INTO task_logs (task_id, user_id, started_at, status, log_entries) VALUES (?, ?, ?, ?, ?)',
      )
      .run(task.id, req.user.id, now, 'running', JSON.stringify(logEntries));

    // Return immediately; execution continues asynchronously
    res.json({ ok: true, log_id: logId });

    const log = (message, type = 'info') => {
      console.log(`[Tasks/Run][Task ${task.id}] ${message}`);
      logEntries.push({ time: new Date().toLocaleTimeString(), message, type });
    };

    log(`手动触发任务: ${task.name}`);

    executeScheduledTask(task, userTokens, batchSettings, log)
      .then(() => {
        log('任务完成', 'success');
        try {
          db
            .prepare(
              'UPDATE task_logs SET finished_at = ?, status = ?, log_entries = ? WHERE id = ?',
            )
            .run(new Date().toISOString(), 'completed', JSON.stringify(logEntries), logId);
        } catch {}
      })
      .catch((err) => {
        log(`任务失败: ${err.message}`, 'error');
        try {
          db
            .prepare(
              'UPDATE task_logs SET finished_at = ?, status = ?, log_entries = ? WHERE id = ?',
            )
            .run(new Date().toISOString(), 'failed', JSON.stringify(logEntries), logId);
        } catch {}
      });
  } catch (err) {
    console.error('[Tasks] Manual run error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
