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

                case 'ADD': // Додавання предмета в багаж
                    return await ActionManager.handleAdd(targetId, logic);

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
        const target = await GamePlayer.findById(targetId).lean();
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
        const actor = await GamePlayer.findById(actorId).lean();
        const target = await GamePlayer.findById(targetId).lean();

        if (!actor) return { success: false, message: "Актор не знайдений" };
        if (!target) return { success: false, message: "Ціль не знайдена" };

        if (logic.mode === 'SWAP') {
            const actorVal = actor.cards[field];
            const targetVal = target.cards[field];

            await GamePlayer.bulkWrite([
                {
                    updateOne: {
                        filter: { _id: actorId },
                        update: { $set: { [`cards.${field}`]: targetVal } }
                    }
                },
                {
                    updateOne: {
                        filter: { _id: targetId },
                        update: { $set: { [`cards.${field}`]: actorVal } }
                    }
                }
            ]);
            
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