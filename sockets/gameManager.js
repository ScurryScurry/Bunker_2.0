// sockets/gameManager.js
const Room = require('../models/Room');
const RoomService = require('../services/roomService');
const GamePlayer = require('../models/GamePlayer');
const actionManager = require('../services/ActionManager');
module.exports = (io, socket) => {
  socket.on('playerReadyInGame', async (data) => {
    try {
      const { roomCode, userId, username } = data;
      
      const room = await Room.findOne({ roomCode });
      if (!room) {
        return socket.emit('error', '❌ Кімнату не знайдено');
      }

      const player = await GamePlayer.findOne({ roomCode, userId });
      if (!player) {
          return socket.emit('error', '❌ Вас не знайдено у списку гравців цієї кімнати');
      }

      // Зберігаємо socket.id на гравцеві для ідентифікації при використанні навичок
      await GamePlayer.updateOne({ _id: player._id }, { $set: { socketId: socket.id } });

      socket.join(roomCode);
      socket.currentRoom = roomCode;
      socket.myUserId = userId;
      await RoomService.cleanupIfEmpty(roomCode, io);
      // Витягуємо всіх гравців для відправки на фронт
      const players = await GamePlayer.find({ roomCode });

      io.to(roomCode).emit('playerLoaded', {
        username: username,
        players: players, 
        bunkerData: room.bunkerData,
        disasterData: room.disasterData
      });

      console.log(`🎮 Гравець ${username} успішно зайшов у гру ${roomCode}`);
    } catch (err) {
      console.error('Помилка при playerReadyInGame:', err);
      socket.emit('error', '❌ Помилка ініціалізації гри');
    }
  });
  // sockets/gameManager.js
socket.on('leaveGame', async (data) => {
    try {
        const { roomCode, userId } = data;
        
        // Видаляємо гравця безповоротно
        await GamePlayer.deleteOne({ roomCode, userId });
        console.log(`🏃 Гравець ${userId} свідомо покинув гру ${roomCode}`);

        // Оновлюємо список для тих, хто залишився
        const playersLeft = await GamePlayer.find({ roomCode });
        io.to(roomCode).emit('playerLoaded', { players: playersLeft });

        // Перевіряємо, чи не порожня тепер кімната
        await RoomService.cleanupIfEmpty(roomCode, io);
    } catch (err) {
        console.error('Помилка при leaveGame:', err);
    }
    });
};