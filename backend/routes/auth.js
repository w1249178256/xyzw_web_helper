const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb } = require('../database');
const { requireAuth, signToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username.trim());
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Update last login time
    db.prepare('UPDATE users SET last_login = datetime(\'now\') WHERE id = ?').run(user.id);

    const token = signToken(user.id);
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        is_admin: !!user.is_admin,
        created_at: user.created_at,
        last_login: user.last_login
      }
    });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, password, invite_code } = req.body;
    if (!username || !password || !invite_code) {
      return res.status(400).json({ error: 'Username, password and invite code are required' });
    }

    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ error: 'Username must be 3-20 characters' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ error: 'Username can only contain letters, numbers, and underscores' });
    }

    const db = getDb();

    // Validate invite code
    const invite = db.prepare(
      'SELECT * FROM invites WHERE code = ? AND used_by IS NULL AND expires_at > datetime(\'now\')'
    ).get(invite_code.trim());

    if (!invite) {
      return res.status(400).json({ error: 'Invalid or expired invite code' });
    }

    // Check username uniqueness
    const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username.trim());
    if (existingUser) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Create user and mark invite as used in a transaction
    const createUser = db.transaction(() => {
      const result = db.prepare(
        'INSERT INTO users (username, password_hash, is_admin) VALUES (?, ?, 0)'
      ).run(username.trim(), passwordHash);

      const newUserId = result.lastInsertRowid;

      db.prepare(
        'UPDATE invites SET used_by = ?, used_at = datetime(\'now\') WHERE id = ?'
      ).run(newUserId, invite.id);

      return newUserId;
    });

    const newUserId = createUser();
    const token = signToken(newUserId);
    const newUser = db.prepare('SELECT id, username, is_admin, created_at FROM users WHERE id = ?').get(newUserId);

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        is_admin: !!newUser.is_admin,
        created_at: newUser.created_at
      }
    });
  } catch (err) {
    console.error('[Auth] Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json({
    id: req.user.id,
    username: req.user.username,
    is_admin: !!req.user.is_admin
  });
});

// POST /api/auth/logout
router.post('/logout', requireAuth, (req, res) => {
  // JWT is stateless; client should discard the token
  res.json({ ok: true });
});

// GET /api/auth/tokens - get user's game tokens
router.get('/tokens', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const row = db.prepare('SELECT tokens_json FROM game_tokens WHERE user_id = ?').get(req.user.id);
    const tokens = row ? JSON.parse(row.tokens_json) : [];
    res.json({ tokens });
  } catch (err) {
    console.error('[Auth] Get tokens error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/auth/tokens - save/sync all user's game tokens
router.put('/tokens', requireAuth, (req, res) => {
  try {
    const { tokens } = req.body;
    if (!Array.isArray(tokens)) {
      return res.status(400).json({ error: 'tokens must be an array' });
    }

    const db = getDb();
    const tokensJson = JSON.stringify(tokens);

    const existing = db.prepare('SELECT id FROM game_tokens WHERE user_id = ?').get(req.user.id);
    if (existing) {
      db.prepare(
        'UPDATE game_tokens SET tokens_json = ?, updated_at = datetime(\'now\') WHERE user_id = ?'
      ).run(tokensJson, req.user.id);
    } else {
      db.prepare(
        'INSERT INTO game_tokens (user_id, tokens_json) VALUES (?, ?)'
      ).run(req.user.id, tokensJson);
    }

    res.json({ ok: true, count: tokens.length });
  } catch (err) {
    console.error('[Auth] Save tokens error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/settings - get user's batch settings
router.get('/settings', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const row = db.prepare('SELECT settings_json FROM user_settings WHERE user_id = ?').get(req.user.id);
    const settings = row ? JSON.parse(row.settings_json) : null;
    res.json({ settings });
  } catch (err) {
    console.error('[Auth] Get settings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/auth/settings - save user's batch settings
router.put('/settings', requireAuth, (req, res) => {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
      return res.status(400).json({ error: 'settings must be a plain object' });
    }

    const db = getDb();
    const settingsJson = JSON.stringify(settings);

    const existing = db.prepare('SELECT id FROM user_settings WHERE user_id = ?').get(req.user.id);
    if (existing) {
      db.prepare(
        "UPDATE user_settings SET settings_json = ?, updated_at = datetime('now') WHERE user_id = ?"
      ).run(settingsJson, req.user.id);
    } else {
      db.prepare(
        'INSERT INTO user_settings (user_id, settings_json) VALUES (?, ?)'
      ).run(req.user.id, settingsJson);
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('[Auth] Save settings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/token-groups - get user's token groups
router.get('/token-groups', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const row = db.prepare('SELECT token_groups_json FROM user_settings WHERE user_id = ?').get(req.user.id);
    const groups = row?.token_groups_json ? JSON.parse(row.token_groups_json) : [];
    res.json({ groups });
  } catch (err) {
    console.error('[Auth] Get token-groups error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/auth/token-groups - save user's token groups
router.put('/token-groups', requireAuth, (req, res) => {
  try {
    const { groups } = req.body;
    if (!Array.isArray(groups)) {
      return res.status(400).json({ error: 'groups must be an array' });
    }

    const db = getDb();
    const json = JSON.stringify(groups);
    const row = db.prepare('SELECT id FROM user_settings WHERE user_id = ?').get(req.user.id);
    if (row) {
      db.prepare("UPDATE user_settings SET token_groups_json = ?, updated_at = datetime('now') WHERE user_id = ?")
        .run(json, req.user.id);
    } else {
      db.prepare("INSERT INTO user_settings (user_id, settings_json, token_groups_json) VALUES (?, '{}', ?)")
        .run(req.user.id, json);
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('[Auth] Save token-groups error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/account-settings - get all per-account daily settings
router.get('/account-settings', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const row = db.prepare('SELECT account_settings_json FROM user_settings WHERE user_id = ?').get(req.user.id);
    const accountSettings = row?.account_settings_json ? JSON.parse(row.account_settings_json) : {};
    res.json({ accountSettings });
  } catch (err) {
    console.error('[Auth] Get account-settings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/auth/account-settings/:tokenId - save one account's daily settings
router.put('/account-settings/:tokenId', requireAuth, (req, res) => {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
      return res.status(400).json({ error: 'settings must be a plain object' });
    }

    const db = getDb();
    const row = db.prepare('SELECT id, account_settings_json FROM user_settings WHERE user_id = ?').get(req.user.id);
    const current = row?.account_settings_json ? JSON.parse(row.account_settings_json) : {};
    current[req.params.tokenId] = settings;
    const json = JSON.stringify(current);

    if (row) {
      db.prepare("UPDATE user_settings SET account_settings_json = ?, updated_at = datetime('now') WHERE user_id = ?")
        .run(json, req.user.id);
    } else {
      db.prepare("INSERT INTO user_settings (user_id, settings_json, account_settings_json) VALUES (?, '{}', ?)")
        .run(req.user.id, json);
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('[Auth] Save account-settings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
