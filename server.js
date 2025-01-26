const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from the 'public' directory
app.use(express.static('public'));

const sessions = {}; // To store drawing data for each session

io.on('connection', (socket) => {
    console.log('A user connected');

    // Handle user joining a session
    socket.on('join', (sessionCode) => {
        socket.join(sessionCode);
        console.log(`User joined session: ${sessionCode}`);

        // Send existing drawing data to the new user
        if (sessions[sessionCode]) {
            socket.emit('load-drawing', sessions[sessionCode]);
        }
    });

    // Handle drawing events
    socket.on('draw', ({ sessionCode, x, y, type }) => {
        if (!sessions[sessionCode]) {
            sessions[sessionCode] = [];
        }
        sessions[sessionCode].push({ x, y, type });

        // Broadcast drawing data to others in the session
        socket.to(sessionCode).emit('draw', { x, y, type });
    });

    // Handle "Clear All" events
    socket.on('clear', (sessionCode) => {
        if (sessions[sessionCode]) {
            sessions[sessionCode] = []; // Clear session data
        }
        io.to(sessionCode).emit('clear'); // Notify all users in the session
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
