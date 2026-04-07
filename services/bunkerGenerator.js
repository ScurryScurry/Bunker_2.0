const BunkerType = require('../models/BunkerType');
const BunkerFeature = require('../models/BunkerFeature');
const BunkerRoom = require('../models/BunkerRoom');
const BunkerRoomState = require('../models/BunkerRoomState');
const Utils = require('./utils'); // Твій файл зі сміттям (генератор коду, рандом)

const BunkerGenerator = {
    generateBunker: async (playersCount) => {
        try {
            // 1. Вибираємо тип бункера, що вміщує нашу кількість гравців
            // (Якщо гравців 6, шукаємо де min <= 6 і max >= 6)
            const suitableBunkers = await BunkerType.find({
                'capacity.min': { $lte: playersCount },
                'capacity.max': { $gte: playersCount }
            });

            if (suitableBunkers.length === 0) {
                throw new Error("Не знайдено бункерів для такої кількості гравців");
            }

            // Беремо випадковий бункер з тих, що підійшли
            const bunkerTemplate = Utils.getRandomItem(suitableBunkers);

            // 2. Визначаємо кількість кімнат (рандом між min та max)
            const minR = bunkerTemplate.rooms_count.min;
            const maxR = bunkerTemplate.rooms_count.max;
            const numRoomsToGenerate = Math.floor(Math.random() * (maxR - minR + 1)) + minR;

            // 3. Шукаємо кімнати за тегами бункера
            // $in означає "знайти всі кімнати, де хоча б один тег є в масиві room_tags бункера"
            const availableRooms = await BunkerRoom.find({
                tags: { $in: bunkerTemplate.room_tags }
            });

            // Перемішуємо знайдені кімнати і беремо потрібну кількість
            const shuffledRooms = availableRooms.sort(() => 0.5 - Math.random());
            const selectedRooms = shuffledRooms.slice(0, numRoomsToGenerate);

            // 4. Отримуємо всі можливі стани кімнат
            const allStates = await BunkerRoomState.find();

            // Збираємо кімнати до купи (додаємо їм стан)
            const generatedRooms = selectedRooms.map(room => {
                const randomState = Utils.getRandomItem(allStates);
                return {
                    name: room.name,
                    description: room.description,
                    stateLabel: randomState.label,
                    stateDescription: randomState.description
                };
            });

            // 5. Вибираємо випадкову особливість бункера
            const allFeatures = await BunkerFeature.find();
            const randomFeature = Utils.getRandomItem(allFeatures);

            // 6. Формуємо фінальний об'єкт Бункера для гри
            return {
                name: bunkerTemplate.name,
                description: bunkerTemplate.short_description,
                feature: {
                    name: randomFeature.name,
                    effect: randomFeature.effect
                },
                rooms: generatedRooms
            };

        } catch (error) {
            console.error("Помилка генерації бункера:", error);
            return null;
        }
    }
};

module.exports = BunkerGenerator;