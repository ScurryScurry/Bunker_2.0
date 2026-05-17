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
    GamePlayer,
    ItemSmall,
    ItemBig
} = require('../models');


const ActionManager = {
    execute: async (executorId, targetId, logic) => {
        try {
            const actionType = logic.effect || logic.action;

            switch (actionType) {
                case 'DESTROY': 
                    return await ActionManager.handleDestroy(targetId, logic);
                
                case 'SWAP':
                    return await ActionManager.handleSwap(executorId, targetId, logic);
                
                case 'STEAL':
                    return await ActionManager.handleSteal(executorId, targetId, logic);
                
                case 'GIVE':
                    return await ActionManager.handleGive(executorId, targetId, logic);

                case 'SET':
                    return await ActionManager.handleSet(targetId, logic);

                case 'REVEAL':
                    return await ActionManager.handleReveal(targetId, logic);

                case 'ADD':
                    return await ActionManager.handleAdd(targetId, logic);

                default:
                    return { success: false, message: `Метод ${actionType} не реалізовано` };
            }
        } catch (error) {
            console.error("🔥 Action Error:", error);
            return { success: false, message: "Помилка при виконанні дії" };
        }
    },

    handleSwap: async (executorId, targetId, logic) => {
        const field = logic.attribute || logic.field;
        const executor = await GamePlayer.findById(executorId);
        const target = await GamePlayer.findById(targetId);

        if (!executor || !target) return { success: false, message: "Гравець не знайдений" };

        const executorVal = executor.cards[field];
        const targetVal = target.cards[field];

        executor.cards[field] = targetVal;
        target.cards[field] = executorVal;

        await executor.save();
        await target.save();

        return { success: true, executor, target };
    },

    handleSteal: async (executorId, targetId, logic) => {
        const field = logic.attribute || logic.field;
        const executor = await GamePlayer.findById(executorId);
        const target = await GamePlayer.findById(targetId);

        if (!executor || !target) return { success: false, message: "Гравець не знайдений" };

        executor.cards[field] = target.cards[field];
        target.cards[field] = Array.isArray(target.cards[field]) ? [] : null;

        await executor.save();
        await target.save();

        return { success: true, executor, target };
    },

    handleGive: async (executorId, targetId, logic) => {
        const field = logic.attribute || logic.field;
        const executor = await GamePlayer.findById(executorId);
        const target = await GamePlayer.findById(targetId);

        if (!executor || !target) return { success: false, message: "Гравець не знайдений" };

        target.cards[field] = executor.cards[field];
        executor.cards[field] = Array.isArray(executor.cards[field]) ? [] : null;

        await executor.save();
        await target.save();

        return { success: true, executor, target };
    },

    async handleDestroy(targetId, logic) {
        const targetField = logic.attribute || logic.field;
        const updatedTarget = await GamePlayer.findByIdAndUpdate(
            targetId, 
            { $set: { [`cards.${targetField}`]: null } }, 
            { new: true }
        );
        return { success: true, target: updatedTarget };
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
    },

    // 🛠 ВІДКРИТТЯ КАРТИ (Приклад: Примусове розкриття)
    handleReveal: async (targetId, logic) => {
        const field = logic.field || logic.attribute;
        const target = await GamePlayer.findById(targetId).lean();
        if (!target) return { success: false, message: "Ціль не знайдена" };

        // Перевіряємо чи існує карта перед розкриттям
        if (!target.cards[field]) {
            return { success: false, message: `У цілі відсутня карта ${field}` };
        }

        // Додаємо карту до revealedCards і, якщо потрібно, видаляємо з cards
        if (logic.removeAfterReveal) {
            await GamePlayer.updateOne(
                { _id: targetId },
                { 
                    $set: { [`revealedCards.${field}`]: target.cards[field] },
                    $unset: { [`cards.${field}`]: "" }
                }
            );
        } else {
            await GamePlayer.updateOne(
                { _id: targetId },
                { $set: { [`revealedCards.${field}`]: target.cards[field] } }
            );
        }

        return { success: true, message: `Карту ${field} відкрито` };
    },

    // 🛠 ДОДАВАННЯ ПРЕДМЕТА В МАСИВ (Приклад: поповнення багажу)
    handleAdd: async (targetId, logic) => {
        // 1. Визначаємо масив-ціль: logic.attribute (з fallback на logic.field)
        const targetArrayName = logic.attribute || logic.field;
        // 2. Визначаємо предмет: logic.item або випадковий з БД
        let itemToPush = logic.item;

        console.log("🛒 ActionManager.handleAdd triggered:", { targetId, targetArrayName, itemToPush });

        // Валідація
        if (!targetArrayName) {
            return { success: false, message: "Не вказано поле (attribute/field)" };
        }

        const target = await GamePlayer.findById(targetId).lean();
        if (!target) {
            console.log("❌ handleAdd: target not found for targetId:", targetId);
            return { success: false, message: "Ціль не знайдена" };
        }

        // 3. Якщо exact item не передано — генеруємо випадковий
        if (!itemToPush) {
            console.log(`🎲 handleAdd: no item provided, generating random for ${targetArrayName}`);

            let RandomModel;
            if (targetArrayName === 'inventorySmall') {
                RandomModel = ItemSmall;
            } else if (targetArrayName === 'inventoryBig') {
                RandomModel = ItemBig;
            } else {
                return { success: false, message: `Невідоме поле масиву: ${targetArrayName}` };
            }

            const randomData = await RandomModel.aggregate([{ $sample: { size: 1 } }]);
            if (!randomData || randomData.length === 0) {
                return { success: false, message: `Не знайдено жодного предмета для ${targetArrayName}` };
            }
            itemToPush = randomData[0];
        }

        console.log("📦 handleAdd: target found, current cards:", JSON.stringify(target.cards));

        // 4. Якщо поле ще не ініціалізоване, створюємо порожній масив
        if (!Array.isArray(target.cards[targetArrayName])) {
            console.log(`📦 handleAdd: initializing cards.${targetArrayName} as empty array`);
            await GamePlayer.updateOne(
                { _id: targetId },
                { $set: { [`cards.${targetArrayName}`]: [] } }
            );
        }

        // 5. Атомарне додавання через $push
        console.log(`📦 handleAdd: pushing to cards.${targetArrayName}:`, JSON.stringify(itemToPush));
        const updatedTarget = await GamePlayer.findByIdAndUpdate(
            targetId,
            { $push: { [`cards.${targetArrayName}`]: itemToPush } },
            { new: true }
        ).lean();

        console.log("📦 Update result:", updatedTarget ? "success" : "null (player not found)");
        if (updatedTarget) {
            console.log("📦 Updated cards:", JSON.stringify(updatedTarget.cards));
        }

        return { success: true, target: updatedTarget, message: `Предмет додано до ${targetArrayName}` };
    }
};

module.exports = ActionManager;