const initSqlJs = require('sql.js');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'xyzw.db');

let dbWrapper;

// Compatibility wrapper: exposes better-sqlite3-like synchronous API over sql.js.
// sql.js is an in-memory database; we persist to disk after each write.
class SqlJsWrapper {
  constructor(sqlJsDb) {
    this._db = sqlJsDb;
    this._inTransaction = false;
  }

  _save() {
    if (this._inTransaction) return; // save once after COMMIT, not mid-transaction
    const data = this._db.export();
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  }

  // Normalize rest-style params to array for sql.js stmt.bind()
  _flat(params) {
    if (params.length === 1 && Array.isArray(params[0])) return params[0];
    return params;
  }

  exec(sql) {
    this._db.exec(sql);
    this._save();
  }

  // Ignored: sql.js is in-memory, pragmas like WAL/foreign_keys are no-ops
  pragma() {}

  prepare(sql) {
    const self = this;
    return {
      get(...params) {
        const stmt = self._db.prepare(sql);
        try {
          stmt.bind(self._flat(params));
          return stmt.step() ? stmt.getAsObject() : undefined;
        } finally {
          stmt.free();
        }
      },
      run(...params) {
        self._db.run(sql, self._flat(params));
        const idStmt = self._db.prepare('SELECT last_insert_rowid() as id');
        let lastInsertRowid = 0;
        try {
          if (idStmt.step()) lastInsertRowid = idStmt.getAsObject().id;
        } finally {
          idStmt.free();
        }
        self._save();
        return { lastInsertRowid };
      },
      all(...params) {
        const stmt = self._db.prepare(sql);
        const rows = [];
        try {
          stmt.bind(self._flat(params));
          while (stmt.step()) rows.push(stmt.getAsObject());
        } finally {
          stmt.free();
        }
        return rows;
      }
    };
  }

  // Returns a function (matching better-sqlite3's transaction API)
  transaction(fn) {
    const self = this;
    return function () {
      self._db.run('BEGIN');
      self._inTransaction = true;
      try {
        const result = fn();
        self._db.run('COMMIT');
        self._inTransaction = false;
        self._save();
        return result;
      } catch (e) {
        self._db.run('ROLLBACK');
        self._inTransaction = false;
        throw e;
      }
    };
  }
}

function getDb() {
  if (!dbWrapper) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return dbWrapper;
}

async function initDb() {
  const SQL = await initSqlJs();

  let sqlJsDb;
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    sqlJsDb = new SQL.Database(fileBuffer);
  } else {
    sqlJsDb = new SQL.Database();
  }

  dbWrapper = new SqlJsWrapper(sqlJsDb);

  dbWrapper.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      is_admin INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_login TEXT
    );

    CREATE TABLE IF NOT EXISTS invites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      created_by INTEGER NOT NULL,
      used_by INTEGER,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      used_at TEXT,
      FOREIGN KEY (created_by) REFERENCES users(id),
      FOREIGN KEY (used_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS game_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      tokens_json TEXT NOT NULL DEFAULT '[]',
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      settings_json TEXT NOT NULL DEFAULT '{}',
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS scheduled_tasks (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      run_type TEXT NOT NULL DEFAULT 'daily',
      run_time TEXT,
      cron_expression TEXT,
      interval_minutes INTEGER,
      selected_token_ids TEXT NOT NULL DEFAULT '[]',
      selected_tasks TEXT NOT NULL DEFAULT '[]',
      enabled INTEGER NOT NULL DEFAULT 1,
      time_window TEXT,
      task_params TEXT DEFAULT '{}',
      last_run_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS task_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      started_at TEXT NOT NULL,
      finished_at TEXT,
      status TEXT NOT NULL DEFAULT 'running',
      log_entries TEXT NOT NULL DEFAULT '[]',
      FOREIGN KEY (task_id) REFERENCES scheduled_tasks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS task_templates (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      settings TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  const adminUser = dbWrapper.prepare('SELECT id FROM users WHERE username = ?').get('klee');
  if (!adminUser) {
    const passwordHash = await bcrypt.hash('lt123456', 10);
    dbWrapper.prepare(
      'INSERT INTO users (username, password_hash, is_admin) VALUES (?, ?, 1)'
    ).run('klee', passwordHash);
    console.log('[DB] Admin user "klee" created successfully.');
  } else {
    console.log('[DB] Admin user "klee" already exists.');
  }

  // Migrations: add new columns if they don't exist yet
  try {
    dbWrapper.exec('ALTER TABLE scheduled_tasks ADD COLUMN interval_minutes INTEGER');
    console.log('[DB] Migration: added interval_minutes column');
  } catch (e) {
    // Column already exists, ignore
  }

  try {
    dbWrapper.exec("ALTER TABLE user_settings ADD COLUMN account_settings_json TEXT NOT NULL DEFAULT '{}'");
    console.log('[DB] Migration: added account_settings_json column');
  } catch (e) {
    // Column already exists, ignore
  }

  try {
    dbWrapper.exec("ALTER TABLE user_settings ADD COLUMN token_groups_json TEXT NOT NULL DEFAULT '[]'");
    console.log('[DB] Migration: added token_groups_json column');
  } catch (e) {
    // Column already exists, ignore
  }

  console.log('[DB] Database initialized at', DB_PATH);
  return dbWrapper;
}

module.exports = { getDb, initDb };
