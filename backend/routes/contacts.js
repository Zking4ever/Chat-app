const express = require('express');
const router = express.Router();
const db = require('../db');

// Detect which phone numbers from the list are already registered
router.post('/detect', (req, res) => {
    const { phones } = req.body; // Array of phone numbers

    if (!Array.isArray(phones) || phones.length === 0) {
        return res.json([]);
    }

    try {
        const placeholders = phones.map(() => '?').join(',');
        const stmt = db.prepare(`SELECT id, phone, name, profile_picture FROM Users WHERE phone IN (${placeholders})`);
        const registeredUsers = stmt.all(...phones);
        res.json(registeredUsers);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Add a contact
router.post('/add', (req, res) => {
    const { user_id, contact_phone } = req.body;

    try {
        const contactUser = db.prepare('SELECT id FROM Users WHERE phone = ?').get(contact_phone);
        if (!contactUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        const stmt = db.prepare('INSERT OR IGNORE INTO Contacts (user_id, contact_user_id) VALUES (?, ?)');
        stmt.run(user_id, contactUser.id);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;
