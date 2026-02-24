const express = require('express');
const router = express.Router();
const db = require('../db');

// In a real app, we would use firebase-admin to verify the token here
// For now, we'll implement a mock verification or expect the phone number directly for dev
router.post('/login', (req, res) => {
    const { phone, name, firebaseToken } = req.body;

    if (!phone) {
        return res.status(400).json({ error: 'Phone number is required' });
    }

    try {
        const stmt = db.prepare('INSERT INTO Users (phone, name) VALUES (?, ?) ON CONFLICT(phone) DO UPDATE SET name=excluded.name, last_seen=CURRENT_TIMESTAMP, is_online=1 RETURNING *');
        const user = stmt.get(phone, name || null);
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;
