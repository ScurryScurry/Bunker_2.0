// sockets/gameManager.js
const Room = require('../models/Room');
const RoomService = require('../services/roomService');

module.exports = (io, socket) => {
  socket.on('playerReadyInGame', async (data) => {
    try {
      const { roomCode, userId, username } = data;
      
      // 1. Шукаємо кімнату
      const room = await Room.findOne({ roomCode });

      if (!room) {
        return socket.emit('error', '❌ Кімнату не знайдено');
      }

      // ---> 2. ПОВЕРТАЄМО ГРАВЦЯ В БАЗУ ДАНИХ <---
      const isPlayerAlreadyInRoom = room.players.some(p => p.userId.toString() === userId);
      if (!isPlayerAlreadyInRoom) {
        room.players.push({ userId, username });
        await room.save(); // Обов'язково зберігаємо зміни в MongoDB!
      }

      // 3. Підключаємо сокет до каналу
      socket.join(roomCode);
      socket.currentRoom = roomCode;
      socket.myUserId = userId;

      // 4. Тепер, коли гравець Є В БАЗІ, сервіс побачить його і скасує таймер
      await RoomService.cleanupIfEmpty(roomCode);

      // 5. Відправляємо всім оновлений список з БД
      io.to(roomCode).emit('playerLoaded', {
        username: username,
        players: room.players, // Тепер тут актуальні дані з бази!
        bunkerData: room.bunkerData,
        disasterData: room.disasterData
      });

      console.log(`🎮 Гравець ${username} успішно зайшов у гру ${roomCode} та доданий в БД`);
    } catch (err) {
      console.error('Помилка при playerReadyInGame:', err);
    }
  });
};