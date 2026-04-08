// services/utils.js

const Utils = {
    // 1. Генерація коду кімнати (те, що в тебе вже було)
    generateRoomCode: () => {
        return Math.random().toString(36).substring(2, 6).toUpperCase();
    },
    getRandomInt: (min, max) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    // 2. Рандомізатор, на який зараз свариться сервер
    getRandomItem: (array) => {
        // Захист від дурня: якщо масив порожній, повертаємо null
        if (!array || array.length === 0) return null; 
        
        return array[Math.floor(Math.random() * array.length)];
    },
    getExperience: (age, config) => {
        // 1. Захист: якщо конфіг не доїхав
        if (!config || !config.levels || !Array.isArray(config.levels)) {
            console.error("❌ Utils: Config levels is missing!");
            return { years: 0, label: "Початківець" };
        }

        // 2. Рахуємо максимально можливий стаж. 
        // Припустимо, працювати можна з 16 років.
        const startWorkingAge = 16;
        let maxPossibleExp = age - startWorkingAge;
        
        // Якщо гравець дуже молодий (напр. 17 років), стаж буде від 0 до 1.
        if (maxPossibleExp < 0) maxPossibleExp = 0;

        // 3. Рандом років
        const years = Math.floor(Math.random() * (maxPossibleExp + 1));
        
        // 4. Пошук лейбла. 
        // Важливо: переконайся, що в БД min/max — це Numbers, а не Strings!
        const level = config.levels.find(l => years >= l.min && years <= l.max);
        
        const finalLabel = level ? level.label : config.levels[0].label;

        // ДЕБАГ: Розкоментуй це, якщо знову буде нуль, щоб побачити логіку в терміналі
        // console.log(`DEBUG Exp: Age:${age}, MaxExp:${maxPossibleExp}, Rolled:${years}, Label:${finalLabel}`);

        return { years, label: finalLabel };
    }
};

// Обов'язково експортуємо весь об'єкт!
module.exports = Utils;