import Database from 'better-sqlite3'
import { mkdirSync, existsSync } from 'fs'
import { dirname } from 'path'

const DB_PATH = process.env.DB_PATH || './data/database.sqlite'

if (!existsSync(dirname(DB_PATH))) {
  mkdirSync(dirname(DB_PATH), { recursive: true })
}

export const db = new Database(DB_PATH)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'pagador',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS consortiums (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      total_value REAL NOT NULL,
      installment_value REAL NOT NULL,
      start_date TEXT NOT NULL,
      total_installments INTEGER NOT NULL,
      description TEXT,
      created_by INTEGER REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS consortium_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      consortium_id INTEGER NOT NULL REFERENCES consortiums(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(consortium_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      consortium_id INTEGER REFERENCES consortiums(id) ON DELETE CASCADE,
      payment_date TEXT NOT NULL,
      installment_amount REAL NOT NULL,
      extra_amount REAL DEFAULT 0,
      note TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      confirmed_by INTEGER REFERENCES users(id),
      confirmed_at TEXT,
      created_by INTEGER REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now'))
    );
  `)

  // Migrations for existing databases
  const userCols = db.prepare('PRAGMA table_info(users)').all().map(c => c.name)
  if (!userCols.includes('role')) {
    db.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'recebedor'")
  }
  // Migrate any legacy master users to recebedor
  db.exec("UPDATE users SET role = 'recebedor' WHERE role = 'master'")

  const consortiumCols2 = db.prepare('PRAGMA table_info(consortiums)').all().map(c => c.name)
  if (!consortiumCols2.includes('interest_rate')) {
    db.exec('ALTER TABLE consortiums ADD COLUMN interest_rate REAL NOT NULL DEFAULT 0')
  }

  const memberCols = db.prepare('PRAGMA table_info(consortium_members)').all().map(c => c.name)
  if (!memberCols.includes('status')) {
    db.exec("ALTER TABLE consortium_members ADD COLUMN status TEXT NOT NULL DEFAULT 'accepted'")
  }

  const paymentCols = db.prepare('PRAGMA table_info(payments)').all().map(c => c.name)
  if (!paymentCols.includes('status')) {
    // Existing payments are already settled — mark as confirmed
    db.exec("ALTER TABLE payments ADD COLUMN status TEXT NOT NULL DEFAULT 'confirmed'")
  }
  if (!paymentCols.includes('confirmed_by')) {
    db.exec('ALTER TABLE payments ADD COLUMN confirmed_by INTEGER REFERENCES users(id)')
  }
  if (!paymentCols.includes('confirmed_at')) {
    db.exec('ALTER TABLE payments ADD COLUMN confirmed_at TEXT')
  }
}
