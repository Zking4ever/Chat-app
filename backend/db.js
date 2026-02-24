const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'messaging.db'), { verbose: console.log });

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize schema
const schema = `
CREATE TABLE IF NOT EXISTS Users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT UNIQUE NOT NULL,
    name TEXT,
    username TEXT UNIQUE,
    profile_picture TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_seen DATETIME,
    is_online BOOLEAN DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_users_phone ON Users(phone);

CREATE TABLE IF NOT EXISTS Contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    contact_user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, contact_user_id),
    FOREIGN KEY(user_id) REFERENCES Users(id),
    FOREIGN KEY(contact_user_id) REFERENCES Users(id)
);

CREATE TABLE IF NOT EXISTS Conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_message_at DATETIME
);

CREATE TABLE IF NOT EXISTS ConversationParticipants (
    conversation_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    PRIMARY KEY (conversation_id, user_id),
    FOREIGN KEY(conversation_id) REFERENCES Conversations(id),
    FOREIGN KEY(user_id) REFERENCES Users(id)
);

CREATE TABLE IF NOT EXISTS Messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL,
    sender_id INTEGER NOT NULL,
    text TEXT,
    reply_to INTEGER,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    delivered_at DATETIME,
    read_at DATETIME,
    status TEXT CHECK(status IN ('sent','delivered','read')) DEFAULT 'sent',
    FOREIGN KEY(conversation_id) REFERENCES Conversations(id),
    FOREIGN KEY(sender_id) REFERENCES Users(id),
    FOREIGN KEY(reply_to) REFERENCES Messages(id)
);
`;

db.exec(schema);

module.exports = db;
