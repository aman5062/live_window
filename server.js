const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files (if any)
app.use(express.static('public'));

const sessions = {}; // Store session data

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('join', (sessionCode) => {
        socket.join(sessionCode);
        console.log(`User joined session: ${sessionCode}`);

        if (sessions[sessionCode]) {
            socket.emit('load-drawing', sessions[sessionCode]);
        }
    });

    socket.on('draw', ({ sessionCode, x, y, type }) => {
        if (!sessions[sessionCode]) {
            sessions[sessionCode] = [];
        }
        sessions[sessionCode].push({ x, y, type });
        socket.to(sessionCode).emit('draw', { x, y, type });
    });

    socket.on('clear', (sessionCode) => {
        if (sessions[sessionCode]) {
            sessions[sessionCode] = [];
        }
        io.to(sessionCode).emit('clear');
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

// Ensure the server listens on the correct port using Render's $PORT environment variable
const PORT = process.env.PORT || 3000;  // Use process.env.PORT for Render, default to 3000 if local
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
