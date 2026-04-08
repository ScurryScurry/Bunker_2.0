const Utils = require('./utils');
const Profession = require('../models/Profession');
const Gender = require('../models/Gender');
const BioSetting = require('../models/BioSetting');
const GamePlayer = require('../models/GamePlayer');
const Health = require('../models/Health');
const Phobia = require('../models/Phobia');
const Hobby = require('../models/Hobby');
const ItemBig = require('../models/ItemBig');
const ItemSmall = require('../models/ItemSmall');
const Character = require('../models/Character');
const ExtraInfo = require('../models/ExtraInfo');
const ExperienceConfig = require('../models/ExperienceConfig');

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
            const allHobbies = await Hobby.find(packFilter).lean();
            const allSmallItems = await ItemSmall.find(packFilter).lean();
            const allBigItems = await ItemBig.find(packFilter).lean();
            const allCharacters = await Character.find(packFilter).lean();
            const allExtra = await ExtraInfo.find(packFilter).lean();
            
            if (!allHealth.length) {
                console.error("🚨 Помилка: Картки здоров'я не знайдені!");
                return false;
            }

            let availableProfessions = [...allProfessions];
            let availableHealth = [...allHealth]; // Масив для роздачі без повторів (якщо хочеш)
            let availablePhobias = [...allPhobias];
            let availableHobbies = [...allHobbies];
            let availableSmall = [...allSmallItems];
            let availableBig = [...allBigItems];
            let availableCharacters = [...allCharacters];
            let availableExtra = [...allExtra];
            for (let player of gamePlayers) {
                // Витягуємо рандомні елементи з видаленням (щоб не повторювались)
                const randomAge = Utils.getRandomInt(bioConfig.age.min, bioConfig.age.max);
                //const assignedProfession = availableProfessions.splice(Utils.getRandomInt(0, availableProfessions.length - 1), 1)[0];
                // ТИМЧАСОВО ДЛЯ ТЕСТУ:
                const assignedProfession = allProfessions.find(p => p._id === 'cls_traumatologist') || allProfessions[0];
                const assignedHealth = availableHealth.splice(Utils.getRandomInt(0, availableHealth.length - 1), 1)[0];
                const assignedPhobia = availablePhobias.splice(Utils.getRandomInt(0, availablePhobias.length - 1), 1)[0];
                const assignedHobby = availableHobbies.splice(Utils.getRandomInt(0, availableHobbies.length - 1), 1)[0];
                const startSmall = availableSmall.splice(Utils.getRandomInt(0, availableSmall.length - 1), 1)[0];
                const startBig = availableBig.splice(Utils.getRandomInt(0, availableBig.length - 1), 1)[0];
                const randomGender = Utils.getRandomItem(allGenders);
                const assignedCharacter = availableCharacters.splice(Utils.getRandomInt(0, availableCharacters.length - 1), 1)[0];
                const assignedExtra = availableExtra.splice(Utils.getRandomInt(0, availableExtra.length - 1), 1)[0];
                const expConfig = await ExperienceConfig.findById('default').lean();
                const profExp = Utils.getExperience(randomAge, expConfig);
                const hobbyExp = Utils.getExperience(randomAge, expConfig);

                const newCards = { 
                    profession: { ...assignedProfession, experience: profExp },
                    health: assignedHealth,
                    phobia: assignedPhobia,
                    hobby: { ...assignedHobby, experience: hobbyExp },
                    bio: {
                        gender: randomGender.label,
                        orientation: Utils.getRandomItem(randomGender.orientations),
                        age: randomAge
                    },
                    inventorySmall: [startSmall], // Зберігаємо як МАСИВ
                    inventoryBig: [startBig],
                    character: assignedCharacter,
                    extraInfo: assignedExtra,
                    body: { height: Utils.getRandomInt(150, 210), weight: Utils.getRandomInt(50, 120) }
                };

                await GamePlayer.updateOne(
                    { _id: player._id },
                    { 
                        $set: { 
                            cards: newCards, 
                            revealedCards: { 
                                profession: false, 
                                health: false, 
                                phobia: false, 
                                hobby: false, // Нове поле для статусу відкриття
                                bio: false, 
                                body: false,
                                character: false,
                                extraInfo: false,
                                inventorySmall: false, 
                                inventoryBig: false
                            } 
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