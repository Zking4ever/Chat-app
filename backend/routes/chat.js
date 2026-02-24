const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all conversations for a user
router.get('/conversations/:userId', (req, res) => {
    const { userId } = req.params;
    try {
        const stmt = db.prepare(`
            SELECT c.*, 
            (SELECT text FROM Messages WHERE conversation_id = c.id ORDER BY sent_at DESC LIMIT 1) as last_message,
            (SELECT sent_at FROM Messages WHERE conversation_id = c.id ORDER BY sent_at DESC LIMIT 1) as last_message_time
            FROM Conversations c
            JOIN ConversationParticipants cp ON c.id = cp.conversation_id
            WHERE cp.user_id = ?
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
            return res.json({ conversation_id: existing.conversation_id });
        }

        // Create new
        const createConvo = db.prepare('INSERT INTO Conversations (created_at) VALUES (CURRENT_TIMESTAMP)');
        const result = createConvo.run();
        const convoId = result.lastInsertRowid;

        const addPart = db.prepare('INSERT INTO ConversationParticipants (conversation_id, user_id) VALUES (?, ?)');
        addPart.run(convoId, user1);
        addPart.run(convoId, user2);

        res.json({ conversation_id: convoId });
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
    const { conversation_id, sender_id, text, reply_to } = req.body;

    try {
        const stmt = db.prepare('INSERT INTO Messages (conversation_id, sender_id, text, reply_to, status) VALUES (?, ?, ?, ?, ?)');
        const result = stmt.run(conversation_id, sender_id, text, reply_to || null, 'sent');

        db.prepare('UPDATE Conversations SET last_message_at = CURRENT_TIMESTAMP WHERE id = ?').run(conversation_id);

        res.json({ id: result.lastInsertRowid, status: 'sent' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;
