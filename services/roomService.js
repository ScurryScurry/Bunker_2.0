const Room = require('../models/Room');

// Тут просто зберігаємо наші запущені таймери
const timers = {};

const RoomService = {
  // Видаляємо гравця (твій старий код)
  // Метод для примусового видалення гравця (ТЕПЕР АТОМАРНИЙ)
    removePlayer: async (roomCode, userId) => {
        try {
            // $pull сам знаходить і видаляє об'єкт з масиву players прямо всередині бази,
            // не створюючи конфліктів версій (VersionError).
            // { new: true } означає "поверни мені документ вже ПІСЛЯ видалення".
            const updatedRoom = await Room.findOneAndUpdate(
                { roomCode: roomCode },
                { $pull: { players: { userId: userId } } },
                { returnDocument: 'after' } 
            );
            
            return updatedRoom;
        } catch (err) {
            console.error('Помилка видалення гравця:', err);
            return null;
        }
    },

  // Очищення з затримкою
  cleanupIfEmpty: async (roomCode) => {
    try {
      const room = await Room.findOne({ roomCode });
      if (!room) return;

      // 1. Якщо в кімнаті хтось Є
      if (room.players.length > 0) {
        // Якщо раніше був запущений таймер видалення - ВБИВАЄМО ЙОГО
        if (timers[roomCode]) {
          clearTimeout(timers[roomCode]);
          delete timers[roomCode];
          console.log(`✅ Перехід успішний. Таймер видалення кімнати ${roomCode} скасовано.`);
        }
        return;
      }

      // 2. Якщо в кімнаті 0 людей і таймер ще НЕ запущено
      if (!timers[roomCode]) {
        console.log(`⏳ Кімната ${roomCode} порожня. Чекаємо 15 секунд...`);
        
        // Запускаємо таймер
        timers[roomCode] = setTimeout(async () => {
          // Через 15 секунд перевіряємо ще раз
          const finalCheck = await Room.findOne({ roomCode });
          
          if (finalCheck && finalCheck.players.length === 0) {
            await Room.deleteOne({ roomCode });
            console.log(`🗑️ Кімнату ${roomCode} остаточно видалено`);
          }
          
          // Видаляємо таймер з пам'яті
          delete timers[roomCode];
        }, 15000); // 15000 мілісекунд = 15 секунд
      }
      
    } catch (err) {
      console.error('Помилка в cleanupIfEmpty:', err);
    }
  }
};

module.exports = RoomService;