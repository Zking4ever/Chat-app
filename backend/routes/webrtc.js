const express = require('express');
const router = express.Router();

/**
 * Endpoint to provide ICE servers for WebRTC calls.
 * In a real production app, you might use Twilio or similar service
 * to generate ephemeral credentials for TURN servers.
 */
router.get('/ice-servers', (req, res) => {
    // Collect servers from environment variables or use fallback defaults
    const iceServers = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
    ];

    // Add TURN server if configured
    if (process.env.TURN_SERVER_URL) {
        iceServers.push({
            urls: process.env.TURN_SERVER_URL,
            username: process.env.TURN_SERVER_USERNAME,
            credential: process.env.TURN_SERVER_PASSWORD,
        });
    }

    res.json(iceServers);
});

module.exports = router;
