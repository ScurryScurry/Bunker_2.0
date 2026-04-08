const { 
    Profession, 
    Gender, 
    Health, 
    Phobia, 
    Hobby, 
    Character, 
    ExtraInfo, 
    ExperienceConfig, 
    BioSetting, 
    GamePlayer 
} = require('../models');

// services/actionManager.js
const { GamePlayer } = require('../models');

const ActionManager = {
    execute: async (roomId, actorId, targetId, logic) => {
        try {
            // logic.effect або logic.action — залежно від того, що прийшло
            const actionType = logic.effect || logic.action;

            switch (actionType) {
                case 'DESTROY': 
                    return await ActionManager.handleDestroy(targetId, logic);
                
                case 'TRANSFER':
                    return await ActionManager.handleTransfer(actorId, targetId, logic);

                case 'SET': // Пряме встановлення значення (наприклад, змінити вік)
                    return await ActionManager.handleSet(targetId, logic);

                case 'REVEAL': // Примусове відкриття карти іншого гравця
                    return await ActionManager.handleReveal(targetId, logic);

                default:
                    return { success: false, message: `Метод ${actionType} не реалізовано` };
            }
        } catch (error) {
            console.error("🔥 Action Error:", error);
            return { success: false, message: "Помилка при виконанні дії" };
        }
    },

    // 🛠 ВИДАЛЕННЯ / ЛІКУВАННЯ (Приклад: Травматолог)
    handleDestroy: async (targetId, logic) => {
        const field = logic.attribute || logic.field; // health, phobia...
        const target = await GamePlayer.findById(targetId);
        if (!target) return { success: false, message: "Ціль не знайдена" };

        const currentCard = target.cards[field];

        // Якщо є фільтр, перевіряємо чи підходить карта
        if (logic.filter && currentCard) {
            const match = Object.entries(logic.filter).every(([key, value]) => currentCard[key] === value);
            if (!match) return { success: false, message: "Ця дія не діє на даний тип карти" };
        }

        // Замість створення картки "Здоровий", просто зануляємо
        await GamePlayer.updateOne(
            { _id: targetId },
            { $set: { [`cards.${field}`]: null } }
        );

        return { success: true, message: `Картку ${field} успішно видалено (скинуто до дефолту)` };
    },

    // 🛠 ОБМІН / ПЕРЕДАЧА (Приклад: Обмін тілами)
    handleTransfer: async (actorId, targetId, logic) => {
        const field = logic.field || logic.attribute;
        const actor = await GamePlayer.findById(actorId);
        const target = await GamePlayer.findById(targetId);

        if (logic.mode === 'SWAP') {
            const actorVal = actor.cards[field];
            const targetVal = target.cards[field];

            await GamePlayer.updateOne({ _id: actorId }, { [`cards.${field}`]: targetVal });
            await GamePlayer.updateOne({ _id: targetId }, { [`cards.${field}`]: actorVal });
            
            return { success: true, message: "Обмін проведено успішно" };
        }
        return { success: false, message: "Mode не підтримується" };
    },

    // 🛠 ВСТАНОВЛЕННЯ (Приклад: Карта "Омолодження")
    handleSet: async (targetId, logic) => {
        const field = logic.field; // наприклад, 'bio.age'
        const value = logic.value; // наприклад, 18

        await GamePlayer.updateOne(
            { _id: targetId },
            { $set: { [`cards.${field}`]: value } }
        );
        return { success: true, message: "Дані оновлено" };
    }
};

module.exports = ActionManager;