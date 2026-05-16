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

        const result = await ActionManager.executeProfessionAction(
            actorId, 
            targetId, 
            player.cards.profession.logic
        );

        if (result.success) {
            const updatedPlayers = await GamePlayer.find({ roomCode: player.roomCode });
            io.to(player.roomCode).emit('gameStateUpdated', { 
                players: updatedPlayers,
                log: `${player.username} використав навичку!` 
            });
        }
    } catch (err) {
        console.error("🔥 Помилка обробки дії:", err);
    }
});
};