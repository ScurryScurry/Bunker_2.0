// services/playerGenerator.js
const Utils = require('./utils');
const Profession = require('../models/Profession');
const GamePlayer = require('../models/GamePlayer'); // Підключаємо модель для прямого апдейту

const PlayerGenerator = {
    generateCardsForPlayers: async (gamePlayers) => {
        try {
            const allProfessions = await Profession.find().lean();
            
            if (!allProfessions || allProfessions.length === 0) {
                console.error("🚨 В БД немає жодної професії! Генерація карток неможлива.");
                return false;
            }

            let availableProfessions = [...allProfessions];

            for (let player of gamePlayers) {
                if (availableProfessions.length === 0) {
                    availableProfessions = [...allProfessions];
                }

                const profIndex = Utils.getRandomInt(0, availableProfessions.length - 1);
                const assignedProfession = availableProfessions.splice(profIndex, 1)[0];

                // Формуємо чисті об'єкти
                const newCards = { profession: assignedProfession };
                const newRevealed = { profession: false };
                
                // 🔥 ЖОРСТКИЙ АПДЕЙТ ПРЯМО В БАЗУ ДАНИХ 🔥
                await GamePlayer.updateOne(
                    { _id: player._id }, // Шукаємо конкретного гравця за його унікальним ID
                    { 
                        $set: { 
                            cards: newCards, 
                            revealedCards: newRevealed 
                        } 
                    }
                );
                
                console.log(`✅ Збережено в БД: професія "${assignedProfession.name}" для ${player.username}`);
            }
            return true;
        } catch (error) {
            console.error("Помилка генерації:", error);
            return false;
        }
    }
};

module.exports = PlayerGenerator;