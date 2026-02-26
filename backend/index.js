const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const db = require('./db');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
const contactRoutes = require('./routes/contacts');
const chatRoutes = require('./routes/chat');
const updateRoutes = require('./routes/updates');

app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/updates', updateRoutes);

// Static folder for updates (bundles and assets)
app.use('/updates', express.static(path.join(__dirname, 'public/updates')));


// Basic sanity check
app.get('/ping', (req, res) => res.send('pong'));

// Socket.io connection logic
const onlineUsers = new Map(); // user_id -> socket_id

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join', (user_id) => {
        socket.join(`user_${user_id}`);
        onlineUsers.set(user_id, socket.id);

        // Update DB status
        try {
            db.prepare('UPDATE Users SET is_online = 1, last_seen = CURRENT_TIMESTAMP WHERE id = ?').run(user_id);
            // Notify others
            io.emit('user_status_changed', { user_id, is_online: 1 });
        } catch (err) {
            console.error('Failed to update online status', err);
        }

        console.log(`User ${user_id} joined their room and is online`);
    });

    socket.on('send_message', (msg) => {
        console.log('Message received:', msg);
        io.emit('message', msg);
    });

    socket.on('typing', ({ convoId, userId, userName }) => {
        socket.broadcast.emit('typing_status', { convoId, userId, userName, isTyping: true });
    });

    socket.on('stop_typing', ({ convoId, userId }) => {
        socket.broadcast.emit('typing_status', { convoId, userId, isTyping: false });
    });

    // Call Signaling
    socket.on('call_user', ({ userToCall, signalData, from, name, callType }) => {
        io.to(`user_${userToCall}`).emit('incoming_call', { signal: signalData, from, name, callType });
    });

    socket.on('answer_call', (data) => {
        io.to(`user_${data.to}`).emit('call_accepted', data.signal);
    });

    socket.on('reject_call', ({ to }) => {
        io.to(`user_${to}`).emit('call_rejected');
    });

    socket.on('ice_candidate', ({ to, candidate }) => {
        io.to(`user_${to}`).emit('ice_candidate', candidate);
    });

    socket.on('save_call_log', (data) => {
        const { conversation_id, sender_id, text, callType, duration, status } = data;
        try {
            const stmt = db.prepare('INSERT INTO Messages (conversation_id, sender_id, text, message_type, metadata, status) VALUES (?, ?, ?, ?, ?, ?)');
            const metadata = JSON.stringify({ callType, duration });
            const result = stmt.run(conversation_id, sender_id, text, 'call', metadata, status === 'Missed' ? 'sent' : 'read');

            db.prepare('UPDATE Conversations SET last_message_at = CURRENT_TIMESTAMP WHERE id = ?').run(conversation_id);

            // Broadcast the new message to participants
            io.emit('message', {
                id: result.lastInsertRowid,
                conversation_id,
                sender_id,
                text,
                message_type: 'call',
                metadata,
                sent_at: new Date().toISOString()
            });
        } catch (err) {
            console.error('Failed to save call log', err);
        }
    });

    socket.on('disconnect', () => {
        let disconnectedUserId = null;
        for (const [userId, socketId] of onlineUsers.entries()) {
            if (socketId === socket.id) {
                disconnectedUserId = userId;
                break;
            }
        }

        if (disconnectedUserId) {
            onlineUsers.delete(disconnectedUserId);
            try {
                db.prepare('UPDATE Users SET is_online = 0, last_seen = CURRENT_TIMESTAMP WHERE id = ?').run(disconnectedUserId);
                io.emit('user_status_changed', { user_id: disconnectedUserId, is_online: 0 });
            } catch (err) {
                console.error('Failed to update offline status', err);
            }
            console.log(`User ${disconnectedUserId} disconnected`);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
