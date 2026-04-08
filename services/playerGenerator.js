// services/playerGenerator.js
const Utils = require('./utils');
const Profession = require('../models/Profession');
const Gender = require('../models/Gender');
const BioSetting = require('../models/BioSetting');
const GamePlayer = require('../models/GamePlayer');

const PlayerGenerator = {
    generateCardsForPlayers: async (gamePlayers) => {
        try {
            console.log("START: Генерація з урахуванням паків");

            // 1. Фільтр для професій (використовує pack_id)
            const profFilter = { pack_id: "pack_classic" };

            // 2. Фільтр для гендерів (використовує req_pack та дозволяє null)
            const genderFilter = { 
                $or: [
                    { req_pack: "pack_classic" },
                    { req_pack: null } 
                ]
            };
            const allProfessions = await Profession.find(profFilter).lean();
            const allGenders = await Gender.find(genderFilter).lean();
            const bioConfig = await BioSetting.findOne({ _id: 'default' }).lean();
            console.log(`DATA: Професій: ${allProfessions.length}, Гендерів: ${allGenders.length}, Конфіг Біо: ${bioConfig ? 'ОК' : 'НЕМАЄ'}`);

            if (!allGenders.length || !bioConfig) {
                console.error("🚨 Помилка: Гендери або Біо-налаштування не знайдені в БД!");
                return false;
            }

            let availableProfessions = [...allProfessions];

            for (let player of gamePlayers) {
                // Вибір професії
                const profIndex = Utils.getRandomInt(0, availableProfessions.length - 1);
                const assignedProfession = availableProfessions.splice(profIndex, 1)[0];

                // Вибір біо
                const randomGender = Utils.getRandomItem(allGenders);
                const randomOrientation = Utils.getRandomItem(randomGender.orientations);
                const randomAge = Utils.getRandomInt(bioConfig.age.min, bioConfig.age.max);

                // Вибір тіла
                const randomHeight = Utils.getRandomInt(bioConfig.height.min, bioConfig.height.max);
                const randomWeight = Utils.getRandomInt(bioConfig.weight.min, bioConfig.weight.max);

                const newCards = { 
                    profession: assignedProfession,
                    bio: {
                        gender: randomGender.label,
                        orientation: randomOrientation,
                        age: randomAge
                    },
                    body: {
                        height: randomHeight,
                        weight: randomWeight
                    }
                };

                console.log(`DEBUG: Картки для ${player.username}:`, JSON.stringify(newCards.bio));

                // ОНОВЛЕННЯ В БАЗІ
                const result = await GamePlayer.updateOne(
                    { _id: player._id },
                    { 
                        $set: { 
                            cards: newCards, 
                            revealedCards: { profession: false, bio: false, body: false } 
                        } 
                    }
                );
                
                console.log(`✅ Результат запису для ${player.username}:`, result.modifiedCount > 0 ? "Успішно оновлено" : "Нічого не змінено");
            }
            return true;
        } catch (error) {
            console.error("🔥 КРИТИЧНА ПОМИЛКА ГЕНЕРАЦІЇ:", error);
            return false;
        }
    }
};

module.exports = PlayerGenerator;