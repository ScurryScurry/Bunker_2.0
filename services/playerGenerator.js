const Utils = require('./utils');
const Profession = require('../models/Profession');
const Gender = require('../models/Gender');
const BioSetting = require('../models/BioSetting');
const GamePlayer = require('../models/GamePlayer');
const Health = require('../models/Health');
const Phobia = require('../models/Phobia');

const PlayerGenerator = {
    generateCardsForPlayers: async (gamePlayers) => {
        try {
            const packFilter = { pack_id: "pack_classic" };
            const genderFilter = { $or: [{ req_pack: "pack_classic" }, { req_pack: null }] };

            // Завантажуємо всі необхідні дані
            const allProfessions = await Profession.find(packFilter).lean();
            const allGenders = await Gender.find(genderFilter).lean();
            const allHealth = await Health.find(packFilter).lean(); // Додаємо здоров'я
            const bioConfig = await BioSetting.findOne({ _id: 'default' }).lean();
            const allPhobias = await Phobia.find(packFilter).lean();

            if (!allHealth.length) {
                console.error("🚨 Помилка: Картки здоров'я не знайдені!");
                return false;
            }

            let availableProfessions = [...allProfessions];
            let availableHealth = [...allHealth]; // Масив для роздачі без повторів (якщо хочеш)
            let availablePhobias = [...allPhobias];
            for (let player of gamePlayers) {
                // Вибір професії
                const profIndex = Utils.getRandomInt(0, availableProfessions.length - 1);
                const assignedProfession = availableProfessions.splice(profIndex, 1)[0];
               
                // Рандом фобії
                const phobiaIndex = Utils.getRandomInt(0, availablePhobias.length - 1);
                const assignedPhobia = availablePhobias.splice(phobiaIndex, 1)[0];
                
                // Вибір здоров'я
                const healthIndex = Utils.getRandomInt(0, availableHealth.length - 1);
                const assignedHealth = availableHealth.splice(healthIndex, 1)[0];

                // Інші дані (Біо, Тіло)
                const randomGender = Utils.getRandomItem(allGenders);
                const randomAge = Utils.getRandomInt(bioConfig.age.min, bioConfig.age.max);

                const newCards = { 
                    profession: assignedProfession,
                    health: assignedHealth, // Додаємо в об'єкт
                    phobia: assignedPhobia,
                    bio: {
                        gender: randomGender.label,
                        orientation: Utils.getRandomItem(randomGender.orientations),
                        age: randomAge
                    },
                    body: { height: Utils.getRandomInt(150, 210), weight: Utils.getRandomInt(50, 120) }
                };

                await GamePlayer.updateOne(
                    { _id: player._id },
                    { 
                        $set: { 
                            cards: newCards, 
                            revealedCards: { profession: false, bio: false, body: false, health: false, phobia: false } 
                        } 
                    }
                );
            }
            return true;
        } catch (error) {
            console.error("🔥 Помилка генерації:", error);
            return false;
        }
    }
};

module.exports = PlayerGenerator;