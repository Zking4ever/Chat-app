import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export const initDB = async () => {
    if (db) return db;
    db = await SQLite.openDatabaseAsync('messaging_local.db');

    await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY NOT NULL,
      conversation_id INTEGER NOT NULL,
      sender_id INTEGER NOT NULL,
      text TEXT,
      sent_at DATETIME,
      status TEXT
    );
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      name TEXT,
      is_registered BOOLEAN
    );
  `);
    return db;
};

export const getDB = () => {
    if (!db) throw new Error('Database not initialized');
    return db;
};
