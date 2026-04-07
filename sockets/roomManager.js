// sockets/roomManager.js
const Room = require('../models/Room');
const RoomService = require('../services/roomService');
const BunkerGenerator = require('../services/bunkerGenerator');
const DisasterGenerator = require('../services/disasterGenerator');

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
          mode: data.mode,
          players: [{ userId: data.userId, username: data.username }]
        });

        await newRoom.save();
        socket.join(roomCode);

        // ВАЖЛИВО: Запам'ятовуємо дані прямо в об'єкті socket
        socket.currentRoom = roomCode;
        socket.myUserId = data.userId;

        socket.emit('roomCreated', { roomCode, room: newRoom });
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

        const isPlayerIn = room.players.some(p => p.userId.toString() === userId);
        if (!isPlayerIn) {
          room.players.push({ userId, username });
          await room.save();
        }

        socket.join(roomCode);

        // ВАЖЛИВО: Запам'ятовуємо дані і для гостя
        socket.currentRoom = roomCode;
        socket.myUserId = userId;

        socket.emit('roomJoined', { roomCode, room }); 
        io.to(roomCode).emit('roomUpdated', room);
      } catch (error) {
        socket.emit('error', '❌ Помилка підключення');
      }
    });

    // --- 3. ОБРОБКА ВИХОДУ ---
    socket.on('disconnect', async () => {
      // Тепер ці дані доступні тут!
      if (socket.currentRoom && socket.myUserId) {
        const { currentRoom, myUserId } = socket;

        try {
          const updatedRoom = await RoomService.removePlayer(currentRoom, myUserId);
          
          if (updatedRoom) {
            io.to(currentRoom).emit('roomUpdated', updatedRoom);
            await RoomService.cleanupIfEmpty(currentRoom);
          }
        } catch (err) {
          console.error('Помилка при дисконекті:', err);
        }
      }
    });

    // --- 4. СТАРТ ГРИ ---
    // Подія початку гри
    socket.on('startGame', async (data) => {
        try {
            const { roomCode, userId } = data;
            const room = await Room.findOne({ roomCode });

            if (!room) return socket.emit('error', '❌ Кімнату не знайдено');
            if (room.hostId.toString() !== userId) return socket.emit('error', '⚠️ Тільки хост може почати гру!');
            
            // --- НОВИЙ БЛОК: ГЕНЕРАЦІЯ БУНКЕРА ---
            const playersCount = room.players.length;
            // Рахуємо скільки гравців і передаємо в генератор
            const generatedBunker = await BunkerGenerator.generateBunker(playersCount);
            
            const generatedDisaster = await DisasterGenerator.generateDisaster(); // <--- ГЕНЕРУЄМО

            if (!generatedBunker || !generatedDisaster) {
                return socket.emit('error', '❌ Помилка генерації світу');
            }

            room.bunkerData = generatedBunker;
            room.disasterData = generatedDisaster; // Зберігаємо в об'єкт кімнати
            // ------------------------------------

            room.status = 'playing';
            await room.save(); // Зберігаємо і статус, і бункер в MongoDB

            io.to(roomCode).emit('gameStarted');
            console.log(`🚀 Гра в кімнаті ${roomCode} почалася! Бункер згенеровано.`);
        } catch (error) {
            console.error('Помилка старту гри:', error);
            socket.emit('error', '❌ Помилка сервера при запуску гри');
        }
    });
  };
;