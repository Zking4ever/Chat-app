const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const db = require('../db');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * GET /api/users/search?q=<query>
 * Search users by name or username (case insensitive, partial match).
 */
router.get('/search', (req, res) => {
    const q = (req.query.q || '').toString().trim();
    if (q.length < 1) return res.json([]);

    try {
        const pattern = `%${q}%`;
        const stmt = db.prepare(`
            SELECT id, name, username, profile_picture, is_online, last_seen
            FROM Users
            WHERE name LIKE ? OR username LIKE ?
            LIMIT 30
        `);
        const users = stmt.all(pattern, pattern);
        res.json(users);
    } catch (err) {
        console.error('Search error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

/**
 * GET /api/users/check-username?username=<username>&exclude_id=<userId>
 * Returns { available: true/false }
 * Excludes the given user so they can keep their own username.
 */
router.get('/check-username', (req, res) => {
    const username = (req.query.username || '').toString().trim().toLowerCase();
    const excludeId = parseInt(req.query.exclude_id) || 0;

    if (!username) return res.json({ available: false });

    // Validate format: only letters, numbers, underscores, dots
    if (!/^[a-z0-9_.]{1,30}$/.test(username)) {
        return res.json({ available: false, reason: 'invalid_format' });
    }

    try {
        const existing = db.prepare(
            'SELECT id FROM Users WHERE LOWER(username) = ? AND id != ?'
        ).get(username, excludeId);
        res.json({ available: !existing });
    } catch (err) {
        console.error('Username check error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

/**
 * PATCH /api/users/:id
 * Update user profile: name, username, profile_picture.
 * If profile_picture is a base64 data URL, it is decoded and saved to disk.
 * Returns the updated user object.
 */
router.patch('/:id', (req, res) => {
    const userId = parseInt(req.params.id);
    if (!userId) return res.status(400).json({ error: 'Invalid user id' });

    const { name, username, profile_picture } = req.body;

    try {
        // Validate username uniqueness if provided
        if (username !== undefined) {
            const trimmed = username.trim().toLowerCase();
            if (trimmed && !/^[a-z0-9_.]{1,30}$/.test(trimmed)) {
                return res.status(400).json({ error: 'Invalid username format' });
            }
            if (trimmed) {
                const conflict = db.prepare(
                    'SELECT id FROM Users WHERE LOWER(username) = ? AND id != ?'
                ).get(trimmed, userId);
                if (conflict) {
                    return res.status(409).json({ error: 'Username already taken' });
                }
            }
        }

        // Handle profile picture — base64 data URL → save to disk
        let picturePath = profile_picture;
        if (profile_picture && profile_picture.startsWith('data:image')) {
            // Extract base64 payload
            const matches = profile_picture.match(/^data:image\/(\w+);base64,(.+)$/s);
            if (matches) {
                const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
                const buffer = Buffer.from(matches[2], 'base64');
                const filename = `${userId}_${Date.now()}.${ext}`;
                const filePath = path.join(uploadsDir, filename);
                fs.writeFileSync(filePath, buffer);
                picturePath = `/uploads/${filename}`;

                // Clean up old uploaded picture if it exists
                const oldUser = db.prepare('SELECT profile_picture FROM Users WHERE id = ?').get(userId);
                if (oldUser && oldUser.profile_picture && oldUser.profile_picture.startsWith('/uploads/')) {
                    const oldPath = path.join(__dirname, '..', oldUser.profile_picture);
                    if (fs.existsSync(oldPath)) {
                        try { fs.unlinkSync(oldPath); } catch (e) { /* ignore */ }
                    }
                }
            }
        }

        // Build dynamic update query
        const fields = [];
        const values = [];

        if (name !== undefined) { fields.push('name = ?'); values.push(name.trim() || null); }
        if (username !== undefined) { fields.push('username = ?'); values.push(username.trim().toLowerCase() || null); }
        if (picturePath !== undefined) { fields.push('profile_picture = ?'); values.push(picturePath || null); }

        if (fields.length === 0) {
            // Nothing to update — return current user
            const current = db.prepare('SELECT id, phone, name, username, profile_picture, is_online, last_seen, created_at FROM Users WHERE id = ?').get(userId);
            return res.json(current);
        }

        values.push(userId);
        const updated = db.prepare(
            `UPDATE Users SET ${fields.join(', ')} WHERE id = ? RETURNING id, phone, name, username, profile_picture, is_online, last_seen, created_at`
        ).get(...values);

        if (!updated) return res.status(404).json({ error: 'User not found' });
        res.json(updated);
    } catch (err) {
        console.error('Update profile error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

/**
 * GET /api/users/:id
 * Fetch public profile details.
 */
router.get('/:id', (req, res) => {
    const userId = parseInt(req.params.id);
    if (!userId) return res.status(400).json({ error: 'Invalid user id' });

    try {
        const user = db.prepare('SELECT id, name, username, profile_picture, is_online, last_seen FROM Users WHERE id = ?').get(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (err) {
        console.error('Fetch user error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

/**
 * POST /api/users/push-token
 * Register/update user's push token.
 */
router.post('/push-token', (req, res) => {
    const { userId, token } = req.body;
    if (!userId || !token) return res.status(400).json({ error: 'Missing userId or token' });

    try {
        db.prepare('UPDATE Users SET push_token = ? WHERE id = ?').run(token, userId);
        res.json({ success: true });
    } catch (err) {
        console.error('Push token update error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;
