'use strict';

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const parseTemplate = (t) => ({
  ...t,
  settings: t.settings ? JSON.parse(t.settings) : {},
});

// GET /api/auth/templates
router.get('/templates', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const templates = db
      .prepare('SELECT * FROM task_templates WHERE user_id = ? ORDER BY created_at DESC')
      .all(req.user.id);
    res.json({ templates: templates.map(parseTemplate) });
  } catch (err) {
    console.error('[Templates] List error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/templates
router.post('/templates', requireAuth, (req, res) => {
  try {
    const { name, settings } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'name is required' });
    }
    const db = getDb();
    const id = uuidv4();
    const now = new Date().toISOString();
    db.prepare(
      'INSERT INTO task_templates (id, user_id, name, settings, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
    ).run(id, req.user.id, name.trim(), JSON.stringify(settings || {}), now, now);
    const created = db.prepare('SELECT * FROM task_templates WHERE id = ?').get(id);
    res.status(201).json({ template: parseTemplate(created) });
  } catch (err) {
    console.error('[Templates] Create error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/auth/templates/:id
router.put('/templates/:id', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const existing = db
      .prepare('SELECT * FROM task_templates WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user.id);
    if (!existing) {
      return res.status(404).json({ error: 'Template not found' });
    }
    const { name, settings } = req.body;
    const updatedName = name !== undefined ? name.trim() : existing.name;
    const updatedSettings =
      settings !== undefined ? JSON.stringify(settings) : existing.settings;
    const now = new Date().toISOString();
    db.prepare(
      'UPDATE task_templates SET name = ?, settings = ?, updated_at = ? WHERE id = ? AND user_id = ?',
    ).run(updatedName, updatedSettings, now, req.params.id, req.user.id);
    const updated = db.prepare('SELECT * FROM task_templates WHERE id = ?').get(req.params.id);
    res.json({ template: parseTemplate(updated) });
  } catch (err) {
    console.error('[Templates] Update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/auth/templates/:id
router.delete('/templates/:id', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const existing = db
      .prepare('SELECT id FROM task_templates WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user.id);
    if (!existing) {
      return res.status(404).json({ error: 'Template not found' });
    }
    db.prepare('DELETE FROM task_templates WHERE id = ? AND user_id = ?').run(
      req.params.id,
      req.user.id,
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('[Templates] Delete error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
