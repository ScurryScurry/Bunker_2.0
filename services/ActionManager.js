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
        try {
            const field = logic.attribute || logic.field;
            if (!field) return { success: false, message: "Не вказано поле для обміну" };

            console.log(`🔄 Attempting SWAP: field=${field}, executor=${executorId}, target=${targetId}`);

            const executor = await GamePlayer.findById(executorId).lean();
            const target = await GamePlayer.findById(targetId).lean();

            if (!executor || !target) {
                console.error("❌ SWAP failed: executor or target not found");
                return { success: false, message: "Гравця не знайдено в базі даних" };
            }

            const executorVal = executor.cards?.[field];
            const targetVal = target.cards?.[field];

            if (executorVal === undefined || targetVal === undefined) {
                console.warn(`⚠️ SWAP warning: attribute '${field}' missing in one of the players`);
            }

            // Атомарні оновлення через $set. Використовуємо lean() для читання та updateOne для запису.
            // Це гарантує, що Mongoose побачить зміни в Mixed-типі 'cards'.
            await GamePlayer.updateOne({ _id: executorId }, { $set: { [`cards.${field}`]: targetVal } });
            await GamePlayer.updateOne({ _id: targetId }, { $set: { [`cards.${field}`]: executorVal } });

            console.log(`✅ SWAP successful for field: ${field}`);
            return { success: true };
        } catch (error) {
            console.error("🔥 ActionManager ERROR (handleSwap):", error);
            return { success: false, message: "Критична помилка при обміні карт" };
        }
    },

    handleSteal: async (executorId, targetId, logic) => {
        try {
            const field = logic.attribute || logic.field;
            if (!field) return { success: false, message: "Не вказано поле для викрадення" };

            console.log(`🕵️ Attempting STEAL: field=${field}, thief=${executorId}, victim=${targetId}`);

            const victim = await GamePlayer.findById(targetId).lean();
            if (!victim) {
                console.error("❌ STEAL failed: victim not found");
                return { success: false, message: "Ціль не знайдена" };
            }

            const stolenVal = victim.cards?.[field];
            if (stolenVal === undefined) {
                return { success: false, message: `У цілі відсутня карта: ${field}` };
            }

            // Визначаємо пусте значення залежно від типу (масив чи об'єкт)
            const emptyVal = Array.isArray(stolenVal) ? [] : null;

            await GamePlayer.updateOne({ _id: executorId }, { $set: { [`cards.${field}`]: stolenVal } });
            await GamePlayer.updateOne({ _id: targetId }, { $set: { [`cards.${field}`]: emptyVal } });

            console.log(`✅ STEAL successful: attribute '${field}' transferred`);
            return { success: true };
        } catch (error) {
            console.error("🔥 ActionManager ERROR (handleSteal):", error);
            return { success: false, message: "Критична помилка при викраденні" };
        }
    },

    handleGive: async (executorId, targetId, logic) => {
        try {
            const field = logic.attribute || logic.field;
            if (!field) return { success: false, message: "Не вказано поле для передачі" };

            console.log(`🎁 Attempting GIVE: field=${field}, giver=${executorId}, receiver=${targetId}`);

            const giver = await GamePlayer.findById(executorId).lean();
            if (!giver) {
                console.error("❌ GIVE failed: giver not found");
                return { success: false, message: "Вас не знайдено в базі даних" };
            }

            const giftVal = giver.cards?.[field];
            if (giftVal === undefined) {
                return { success: false, message: `У вас відсутня карта: ${field}` };
            }

            const emptyVal = Array.isArray(giftVal) ? [] : null;

            await GamePlayer.updateOne({ _id: targetId }, { $set: { [`cards.${field}`]: giftVal } });
            await GamePlayer.updateOne({ _id: executorId }, { $set: { [`cards.${field}`]: emptyVal } });

            console.log(`✅ GIVE successful: attribute '${field}' gifted`);
            return { success: true };
        } catch (error) {
            console.error("🔥 ActionManager ERROR (handleGive):", error);
            return { success: false, message: "Критична помилка при передачі" };
        }
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