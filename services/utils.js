// services/utils.js

const Utils = {
    // 1. Генерація коду кімнати (те, що в тебе вже було)
    generateRoomCode: () => {
        return Math.random().toString(36).substring(2, 6).toUpperCase();
    },

    // 2. Рандомізатор, на який зараз свариться сервер
    getRandomItem: (array) => {
        // Захист від дурня: якщо масив порожній, повертаємо null
        if (!array || array.length === 0) return null; 
        
        return array[Math.floor(Math.random() * array.length)];
    }
};

// Обов'язково експортуємо весь об'єкт!
module.exports = Utils;