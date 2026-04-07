// sockets/roomManager.js
const Room = require('../models/Room');
const RoomService = require('../services/roomService');
const BunkerGenerator = require('../services/bunkerGenerator');
const DisasterGenerator = require('../services/disasterGenerator');
const PlayerGenerator = require('../services/playerGenerator');
const GamePlayer = require('../models/GamePlayer');

module.exports = (io, socket) => {
    
    // --- 1. СТВОРЕННЯ КІМНАТИ ---
    socket.on('createRoom', async (data) => {
      try {
        if (socket.currentRoom) {
            console.log("Попередження: Спроба створити кімнату дублікатом");
            return;
        }

        const roomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
        const newRoom = new Room({
          roomCode: roomCode,
          hostId: data.userId,
          mode: data.mode
        });
        await newRoom.save();
        
        // Зберігаємо хоста в нову колекцію
        const host = new GamePlayer({
            roomCode: roomCode,
            userId: data.userId,
            username: data.username,
            isHost: true
        });
        await host.save();

        socket.join(roomCode);
        socket.currentRoom = roomCode;
        socket.myUserId = data.userId;

        // Повертаємо кімнату і актуальних гравців на фронт
        const players = await GamePlayer.find({ roomCode });
        socket.emit('roomCreated', { roomCode, room: { ...newRoom.toObject(), players } });
      } catch (error) {
        socket.emit('error', '❌ Помилка створення кімнати');
      }
    });

    // --- 2. ПРИЄДНАННЯ ДО КІМНАТИ ---
    socket.on('joinRoom', async (data) => {
      try {
        const { roomCode, userId, username } = data;
        const room = await Room.findOne({ roomCode, status: 'lobby' });

        if (!room) return socket.emit('error', '❌ Кімнату не знайдено');

        // Перевіряємо та додаємо гостя в нову колекцію
        const isPlayerIn = await GamePlayer.findOne({ roomCode, userId });
        if (!isPlayerIn) {
            const guest = new GamePlayer({ roomCode, userId, username });
            await guest.save();
        }

        socket.join(roomCode);
        socket.currentRoom = roomCode;
        socket.myUserId = userId;

        const players = await GamePlayer.find({ roomCode });
        const roomData = { ...room.toObject(), players };

        socket.emit('roomJoined', { roomCode, room: roomData }); 
        io.to(roomCode).emit('roomUpdated', roomData);
      } catch (error) {
        socket.emit('error', '❌ Помилка підключення');
      }
    });

    // --- 3. ОБРОБКА ВИХОДУ ---
socket.on('disconnect', async () => {
    if (socket.currentRoom && socket.myUserId) {
        try {
            const room = await Room.findOne({ roomCode: socket.currentRoom });

            // Видаляємо тільки якщо гра ще в лоббі. 
            // Якщо статус "playing", гравець залишається в БД, щоб зберегти картки при перепідключенні.
            if (room && room.status === 'lobby') {
                await GamePlayer.deleteOne({ roomCode: socket.currentRoom, userId: socket.myUserId });
                console.log(`👤 Гравець ${socket.myUserId} вийшов з лоббі ${socket.currentRoom}`);
            }

            // Отримуємо актуальний список гравців після видалення
            const playersLeft = await GamePlayer.find({ roomCode: socket.currentRoom });

            if (room) {
                const roomData = { ...room.toObject(), players: playersLeft };
                // Повідомляємо іншим, що список змінився
                io.to(socket.currentRoom).emit('roomUpdated', roomData);
                // Запускаємо перевірку на порожню кімнату (з твого RoomService)
                await RoomService.cleanupIfEmpty(socket.currentRoom, io);
            }
        } catch (err) {
            console.error('Помилка при дисконекті:', err);
        }
    }
});

    // --- 4. СТАРТ ГРИ ---
    socket.on('startGame', async (data) => {
        try {
            const { roomCode, userId } = data;
            const room = await Room.findOne({ roomCode });

            if (!room) return socket.emit('error', '❌ Кімнату не знайдено');
            if (room.hostId.toString() !== userId) return socket.emit('error', '⚠️ Тільки хост може почати гру!');
            
            const gamePlayers = await GamePlayer.find({ roomCode });
            const playersCount = gamePlayers.length;

            const generatedBunker = await BunkerGenerator.generateBunker(playersCount);
            const generatedDisaster = await DisasterGenerator.generateDisaster(); 
            
            // Викликаємо ОДИН генератор гравців (за новою логікою)
            const success = await PlayerGenerator.generateCardsForPlayers(gamePlayers);

            if (!success || !generatedBunker || !generatedDisaster) {
                return socket.emit('error', '❌ Помилка генерації світу або карток');
            }

            room.bunkerData = generatedBunker;
            room.disasterData = generatedDisaster;
            room.status = 'playing';
            
            room.markModified('bunkerData');
            room.markModified('disasterData');
            await room.save(); 

            io.to(roomCode).emit('gameStarted');
        } catch (error) {
            console.error('Помилка старту гри:', error);
            socket.emit('error', '❌ Помилка сервера при запуску гри');
        }
    });
};