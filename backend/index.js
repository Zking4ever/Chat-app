const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
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

app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/chat', chatRoutes);

// Basic sanity check
app.get('/ping', (req, res) => res.send('pong'));

// Socket.io connection logic
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join', (user_id) => {
        socket.join(`user_${user_id}`);
        console.log(`User ${user_id} joined their room`);
    });

    socket.on('send_message', (msg) => {
        // Message contains conversation_id, sender_id, text, etc.
        // We need to broadcast it to the specific conversation room or specific user.
        // For simplicity, we can broadcast to the conversation room if we join it, 
        // but here we use user-specific rooms. 
        // In a real app, you'd fetch conversation participants.
        // For now, let's relay to the 'message' event.
        console.log('Message received:', msg);
        io.emit('message', msg); // Simple broadcast for now, filtered by frontend
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
