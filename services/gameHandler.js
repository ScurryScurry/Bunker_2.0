const ActionManager = require('../services/ActionManager');
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
module.exports = (io, socket) => {
    socket.on('ping_test', (data) => {
    console.log("📥 СЕРВЕР ЖИВИЙ! Отримано:", data.msg);
    });
    socket.on('useProfessionAction', async ({ targetId }) => {
    console.log("📩 Отримано івент на ціль:", targetId);

    try {
        // Шукаємо гравця в БД по socket.id
        const player = await GamePlayer.findOne({ socketId: socket.id });

        if (!player) {
            console.log("❌ Гравець не знайдений по socket.id:", socket.id);
            return socket.emit('error', 'Вас не ідентифіковано. Спробуйте перезайти.');
        }

        const actorId = player._id; // Тепер беремо ID з результату пошуку в БД
        
        // Перевіряємо логіку професії
        if (!player.cards?.profession?.logic) {
            return socket.emit('error', 'Ваша професія не має активних дій');
        }

        // Перевіряємо чи дія вже використана (захист від повторного використання)
        if (player.cards?.profession?.isUsed) {
            return socket.emit('error', 'Ця дія вже була використана');
        }

        const result = await ActionManager.execute(
            actorId,
            targetId,
            player.cards.profession.logic
        );

        if (result.success) {
            // Позначаємо дію як використану — одноразове використання
            await GamePlayer.updateOne(
                { _id: actorId },
                { $set: { 'cards.profession.isUsed': true } }
            );

            const updatedPlayers = await GamePlayer.find({ roomCode: player.roomCode });
            io.to(player.roomCode).emit('gameStateUpdated', {
                players: updatedPlayers,
                log: `${player.username} використав навичку!`
            });
        } else {
            socket.emit('error', result.message || 'Дія не вдалася');
        }
    } catch (err) {
        console.error("🔥 Помилка обробки дії:", err);
    }
});

// 🃏 Активні карти (одноразові картки з логікою, що зберігаються в Active_cards)
socket.on('useActiveCard', async ({ cardId, targetId }) => {
    console.log("📩 Використання активної карти:", { cardId, targetId });

    try {
        const player = await GamePlayer.findOne({ socketId: socket.id });
        if (!player) {
            return socket.emit('error', 'Вас не ідентифіковано');
        }

        // Знаходимо карту в масиві Active_cards за _id
        const card = player.cards.Active_cards?.find(
            c => c._id.toString() === cardId
        );
        if (!card) {
            return socket.emit('error', 'Активну карту не знайдено');
        }

        const result = await ActionManager.execute(
            player._id,
            targetId,
            card.logic
        );

        if (result.success) {
            // Видаляємо використану карту з масиву ($pull за _id)
            await GamePlayer.updateOne(
                { _id: player._id },
                { $pull: { 'cards.Active_cards': { _id: card._id } } }
            );

            const updatedPlayers = await GamePlayer.find({ roomCode: player.roomCode });
            io.to(player.roomCode).emit('gameStateUpdated', {
                players: updatedPlayers,
                log: `${player.username} використав активну карту: ${card.name}`
            });
        } else {
            socket.emit('error', result.message || 'Дія не вдалася');
        }
    } catch (err) {
        console.error("🔥 Помилка активної карти:", err);
    }
});
};