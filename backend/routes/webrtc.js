const express = require('express');
const router = express.Router();

/**
 * Endpoint to provide ICE servers for WebRTC calls.
 * In a real production app, you might use Twilio or similar service
 * to generate ephemeral credentials for TURN servers.
 */
let cachedIceServers = null;
let cacheExpiry = 0;

router.get('/ice-servers', async (req, res) => {
    try {
        // Simple cache to avoid hitting Metered API on every single call (refresh every 30 mins)
        if (cachedIceServers && Date.now() < cacheExpiry) {
            return res.json(cachedIceServers);
        }

        console.log('Fetching fresh ICE servers from Metered.live...');
        const response = await fetch(`https://astawusamsalu.metered.live/api/v1/turn/credentials?apiKey=${process.env.METERED_API_KEY}`);

        if (!response.ok) {
            throw new Error(`Metered API error: ${response.statusText}`);
        }

        const iceServers = await response.json();

        // Add STUN fallbacks if they aren't already included
        const fallbacks = [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
        ];

        const combinedServers = [...(Array.isArray(iceServers) ? iceServers : []), ...fallbacks];

        // Cache for 30 minutes
        cachedIceServers = combinedServers;
        cacheExpiry = Date.now() + (30 * 60 * 1000);

        res.json(combinedServers);
    } catch (err) {
        console.error('Failed to fetch ICE servers:', err);
        // Fallback to basic STUN servers if the API fails
        res.json([
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
        ]);
    }
});

module.exports = router;
