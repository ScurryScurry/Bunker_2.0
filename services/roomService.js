// services/roomService.js
const Room = require('../models/Room');
const GamePlayer = require('../models/GamePlayer');

const timers = {};

const RoomService = {
  removePlayer: async (roomCode, userId) => {
      try {
          // Видаляємо конкретного гравця як окремий документ
          await GamePlayer.deleteOne({ roomCode: roomCode, userId: userId });
          
          // Повертаємо кімнату, щоб не ламалася логіка, якщо вона десь очікується
          const updatedRoom = await Room.findOne({ roomCode: roomCode });
          return updatedRoom;
      } catch (err) {
          console.error('Помилка видалення гравця:', err);
          return null;
      }
  },
  // Додаємо аргумент io
  cleanupIfEmpty: async (roomCode, io) => { 
    try {
      if (!io) {
        console.error("🚨 Помилка: io не передано в cleanupIfEmpty");
        return;
            }

            // Отримуємо кількість реальних підключень до кімнати
            const activeSockets = io.sockets.adapter.rooms.get(roomCode);
            const numActive = activeSockets ? activeSockets.size : 0;

            console.log(`📊 Кімната ${roomCode}: активних сокетів - ${numActive}`);

            // Якщо є хоч один живий гравець - скасовуємо видалення
            if (numActive > 0) {
                if (timers[roomCode]) {
                    clearTimeout(timers[roomCode]);
                    delete timers[roomCode];
                }
                return;
            }

            // Якщо нікого немає онлайн, запускаємо таймер на 15 сек
            if (!timers[roomCode]) {
                timers[roomCode] = setTimeout(async () => {
                    const recheckSockets = io.sockets.adapter.rooms.get(roomCode);
                    if (!recheckSockets || recheckSockets.size === 0) {
                        await Room.deleteOne({ roomCode });
                        await GamePlayer.deleteMany({ roomCode }); 
                        console.log(`🗑️ Кімнату ${roomCode} видалено (порожня)`);
                    }
                    delete timers[roomCode];
                }, 15000);
            }
        } catch (err) {
            console.error('Помилка в cleanupIfEmpty:', err);
        }
    }
};

module.exports = RoomService;