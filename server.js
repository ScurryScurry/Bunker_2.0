// server.js
require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

// Підключаємо наш новий модуль для сокетів
const roomManager = require('./sockets/roomManager');
const gameManager = require('./sockets/gameManager');

const app = express();
const PORT = process.env.PORT || 3000;

const server = http.createServer(app);
const io = new Server(server);

// Ініціалізація
connectDB();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); 
app.use('/api/auth', authRoutes);

// Передаємо io в наш менеджер кімнат
io.on('connection', (socket) => {
    console.log(`⚡ Нове з'єднання: ${socket.id}`);

    // Передаємо io та socket в наші модулі
    // Тепер roomManager відповідає за лоббі, а gameManager за саму гру
    roomManager(io, socket);
    gameManager(io, socket);

    socket.on('disconnect', () => {
        console.log(`❌ Відключено: ${socket.id}`);
    });
});

server.listen(PORT, () => {
  console.log(`🚀 Сервер з WebSockets запущено на http://localhost:${PORT}`);
});