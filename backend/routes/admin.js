const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// All routes require auth + admin
router.use(requireAuth, requireAdmin);

// GET /api/auth/admin/stats
router.get('/stats', (req, res) => {
  try {
    const db = getDb();

    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const tokenCount = db.prepare(`
      SELECT COALESCE(SUM(json_array_length(tokens_json)), 0) as count FROM game_tokens
    `).get().count;

    // Weekly active users (logged in within last 7 days)
    const weeklyActiveUsers = db.prepare(`
      SELECT COUNT(*) as count FROM users
      WHERE last_login >= datetime('now', '-7 days')
    `).get().count;

    // Active (unused, non-expired) invites
    const activeInvites = db.prepare(`
      SELECT COUNT(*) as count FROM invites
      WHERE used_by IS NULL AND expires_at > datetime('now')
    `).get().count;

    // Recent logins (last 10 users who logged in)
    const recentLogins = db.prepare(`
      SELECT username, last_login FROM users
      WHERE last_login IS NOT NULL
      ORDER BY last_login DESC
      LIMIT 10
    `).all();

    res.json({
      userCount,
      tokenCount,
      weeklyActiveUsers,
      activeInvites,
      recentLogins
    });
  } catch (err) {
    console.error('[Admin] Stats error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/admin/users
router.get('/users', (req, res) => {
  try {
    const db = getDb();

    const users = db.prepare(`
      SELECT
        u.id, u.username, u.is_admin, u.created_at, u.last_login,
        COALESCE(json_array_length(gt.tokens_json), 0) as token_count
      FROM users u
      LEFT JOIN game_tokens gt ON gt.user_id = u.id
      ORDER BY u.created_at DESC
    `).all();

    res.json({
      users: users.map(u => ({
        ...u,
        is_admin: !!u.is_admin
      }))
    });
  } catch (err) {
    console.error('[Admin] Get users error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/auth/admin/users/:id
router.delete('/users/:id', (req, res) => {
  try {
    const targetId = parseInt(req.params.id, 10);
    if (isNaN(targetId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    if (targetId === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }

    const db = getDb();
    const user = db.prepare('SELECT id, username FROM users WHERE id = ?').get(targetId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(targetId);

    res.json({ ok: true, deleted: { id: targetId, username: user.username } });
  } catch (err) {
    console.error('[Admin] Delete user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/admin/invite
router.post('/invite', (req, res) => {
  try {
    const { expires_days = 7 } = req.body;
    const days = Math.max(1, Math.min(365, parseInt(expires_days, 10) || 7));

    const db = getDb();
    const code = uuidv4().replace(/-/g, '').slice(0, 16).toUpperCase();

    db.prepare(`
      INSERT INTO invites (code, created_by, expires_at)
      VALUES (?, ?, datetime('now', '+${days} days'))
    `).run(code, req.user.id);

    const invite = db.prepare('SELECT * FROM invites WHERE code = ?').get(code);

    res.json({
      code: invite.code,
      url: `/register?code=${invite.code}`,
      expires_days: days,
      expires_at: invite.expires_at,
      created_at: invite.created_at
    });
  } catch (err) {
    console.error('[Admin] Create invite error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/admin/invites
router.get('/invites', (req, res) => {
  try {
    const db = getDb();

    const invites = db.prepare(`
      SELECT
        i.id, i.code, i.expires_at, i.created_at, i.used_at,
        creator.username as created_by_username,
        usedby.username as used_by_username
      FROM invites i
      JOIN users creator ON creator.id = i.created_by
      LEFT JOIN users usedby ON usedby.id = i.used_by
      ORDER BY i.created_at DESC
      LIMIT 50
    `).all();

    res.json({
      invites: invites.map(inv => ({
        ...inv,
        is_used: !!inv.used_by_username,
        is_expired: new Date(inv.expires_at) < new Date(),
        is_active: !inv.used_by_username && new Date(inv.expires_at) >= new Date()
      }))
    });
  } catch (err) {
    console.error('[Admin] Get invites error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
