// services/disasterGenerator.js
const Disaster = require('../models/Disaster');
const Utils = require('./utils');

const DisasterGenerator = {
    generateDisaster: async () => {
        try {
            const allDisasters = await Disaster.find();
            
            if (allDisasters.length === 0) {
                throw new Error("Не знайдено жодного варіанту катастрофи в базі");
            }

            const randomDisaster = Utils.getRandomItem(allDisasters);

            return {
                name: randomDisaster.name,
                description: randomDisaster.description,
                duration: randomDisaster.duration,
                destructionLevel: randomDisaster.destruction_level
            };
        } catch (error) {
            console.error("Помилка генерації катастрофи:", error);
            return null;
        }
    }
};

module.exports = DisasterGenerator;