const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Manifest serving for Expo Updates
// This endpoint returns the manifest for the latest available update.
// In a real production environment, you might store different manifestations for different platforms or versions.
router.get('/manifest', (req, res) => {
    const platform = req.headers['expo-platform'];
    const runtimeVersion = req.headers['expo-runtime-version'];

    console.log(`Update check from platform: ${platform}, runtime: ${runtimeVersion}`);

    // In a self-managed setup, the manifest follows the Expo Update protocol.
    // For a simple implementation, we assume the latest update is always in /public/updates/latest
    const manifestPath = path.join(__dirname, '../public/updates/latest/manifest.json');

    if (fs.existsSync(manifestPath)) {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

        // Ensure proper headers for Expo Updates
        res.setHeader('Expo-Protocol-Version', '0');
        res.setHeader('Content-Type', 'application/json');

        return res.json(manifest);
    }

    res.status(404).send('No update available');
});

module.exports = router;
