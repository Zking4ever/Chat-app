const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * POST /api/contacts/detect
 * Given an array of phone numbers, return the subset already registered in Users.
 */
router.post('/detect', (req, res) => {
    const { phones } = req.body;

    if (!Array.isArray(phones) || phones.length === 0) return res.json([]);

    try {
        const placeholders = phones.map(() => '?').join(',');
        const stmt = db.prepare(`SELECT id, phone, name, username, profile_picture FROM Users WHERE phone IN (${placeholders})`);
        const registeredUsers = stmt.all(...phones);
        res.json(registeredUsers);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

/**
 * POST /api/contacts/add
 * Save a contact relationship for a user with an optional personal saved_name.
 * If the row already exists, updates the saved_name when provided.
 *
 * Body: { user_id, contact_phone, saved_name? }
 */
router.post('/add', (req, res) => {
    const { user_id, contact_phone, saved_name } = req.body;

    try {
        const contactUser = db.prepare('SELECT id FROM Users WHERE phone = ?').get(contact_phone);
        if (!contactUser) return res.status(404).json({ error: 'User not found' });

        // INSERT or UPDATE saved_name if the row already exists
        db.prepare(`
            INSERT INTO Contacts (user_id, contact_user_id, saved_name)
            VALUES (?, ?, ?)
            ON CONFLICT(user_id, contact_user_id)
            DO UPDATE SET saved_name = COALESCE(excluded.saved_name, saved_name)
        `).run(user_id, contactUser.id, saved_name || null);

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

/**
 * POST /api/contacts/sync
 * Bulk sync contacts from a user's device.
 * Body: { user_id, contacts: [{ phone, saved_name }] }
 */
router.post('/sync', (req, res) => {
    const { user_id, contacts } = req.body;

    if (!user_id || !Array.isArray(contacts)) {
        return res.status(400).json({ error: 'user_id and contacts array are required' });
    }

    try {
        const insertStmt = db.prepare(`
            INSERT INTO Contacts (user_id, contact_user_id, saved_name)
            VALUES (?, (SELECT id FROM Users WHERE phone = ?), ?)
            ON CONFLICT(user_id, contact_user_id)
            DO UPDATE SET saved_name = excluded.saved_name
            WHERE excluded.saved_name IS NOT NULL
        `);

        const syncTransaction = db.transaction((contacts) => {
            for (const contact of contacts) {
                const phone = contact.phone?.replace(/[^0-9+]/g, '');
                if (phone) {
                    insertStmt.run(user_id, phone, contact.saved_name || null);
                }
            }
        });

        syncTransaction(contacts);
        res.json({ success: true, count: contacts.length });
    } catch (err) {
        console.error('Contact sync error:', err);
        res.status(500).json({ error: 'Database error during sync' });
    }
});

module.exports = router;
