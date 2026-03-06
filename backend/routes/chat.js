const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up storage for uploaded files
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'chat-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Get all conversations for a user
router.get('/conversations/:userId', (req, res) => {
    const { userId } = req.params;
    try {
        const stmt = db.prepare(`
            SELECT c.*, 
            u.id as participant_id, 
            COALESCE(NULLIF(con.saved_name, ''), NULLIF(u.name, ''), u.phone) as participant_name, 
            u.is_online,
            u.profile_picture as participant_picture,
            (SELECT text FROM Messages WHERE conversation_id = c.id ORDER BY sent_at DESC LIMIT 1) as last_message,
            (SELECT sent_at FROM Messages WHERE conversation_id = c.id ORDER BY sent_at DESC LIMIT 1) as last_message_time
            FROM Conversations c
            JOIN ConversationParticipants cp1 ON c.id = cp1.conversation_id
            JOIN ConversationParticipants cp2 ON c.id = cp2.conversation_id AND cp2.user_id != cp1.user_id
            JOIN Users u ON cp2.user_id = u.id
            LEFT JOIN Contacts con ON con.user_id = cp1.user_id AND con.contact_user_id = u.id
            WHERE cp1.user_id = ?
            ORDER BY last_message_at DESC
        `);
        const convos = stmt.all(userId);
        res.json(convos);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Get or create a 1-to-1 conversation
router.post('/get-or-create', (req, res) => {
    const { user1, user2 } = req.body;

    try {
        // Check if 1-to-1 conversation already exists
        const existing = db.prepare(`
            SELECT conversation_id FROM ConversationParticipants 
            WHERE user_id IN (?, ?)
            GROUP BY conversation_id
            HAVING COUNT(DISTINCT user_id) = 2
        `).get(user1, user2);

        if (existing) {
            return res.json({ id: existing.conversation_id });
        }

        // Create new
        const createConvo = db.prepare('INSERT INTO Conversations (created_at) VALUES (CURRENT_TIMESTAMP)');
        const result = createConvo.run();
        const convoId = result.lastInsertRowid;

        const addPart = db.prepare('INSERT INTO ConversationParticipants (conversation_id, user_id) VALUES (?, ?)');
        addPart.run(convoId, user1);
        addPart.run(convoId, user2);

        res.json({ id: convoId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Get messages for a conversation
router.get('/messages/:convoId', (req, res) => {
    const { convoId } = req.params;
    try {
        const stmt = db.prepare('SELECT * FROM Messages WHERE conversation_id = ? ORDER BY sent_at ASC');
        const messages = stmt.all(convoId);
        res.json(messages);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Send a message
router.post('/message', (req, res) => {
    const { conversation_id, sender_id, text, reply_to, message_type, metadata } = req.body;

    try {
        const stmt = db.prepare('INSERT INTO Messages (conversation_id, sender_id, text, reply_to, message_type, metadata, status) VALUES (?, ?, ?, ?, ?, ?, ?)');
        const result = stmt.run(conversation_id, sender_id, text, reply_to || null, message_type || 'text', metadata || null, 'sent');

        db.prepare('UPDATE Conversations SET last_message_at = CURRENT_TIMESTAMP WHERE id = ?').run(conversation_id);

        res.json({ id: result.lastInsertRowid, status: 'sent' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Upload a file directly to the chat (Base64 support)
router.post('/upload', (req, res) => {
    const { fileData, fileName } = req.body;

    if (!fileData || !fileName) {
        return res.status(400).json({ error: 'Missing file data or name' });
    }

    try {
        // Extract base64 payload
        const matches = fileData.match(/^data:(.+);base64,(.+)$/s);
        if (!matches) {
            return res.status(400).json({ error: 'Invalid file data format' });
        }

        const mimetype = matches[1];
        const buffer = Buffer.from(matches[2], 'base64');
        const ext = path.extname(fileName) || '.bin';
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const savedFilename = 'chat-' + uniqueSuffix + ext;
        const filePath = path.join(uploadDir, savedFilename);

        fs.writeFileSync(filePath, buffer);

        res.json({
            url: `/uploads/${savedFilename}`,
            filename: fileName,
            mimetype: mimetype
        });
    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ error: 'Failed to process upload' });
    }
});

module.exports = router;
