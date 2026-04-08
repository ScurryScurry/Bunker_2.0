// В gameHandler.js (або де у тебе сокети гри)
const ActionManager = require('../services/ActionManager');

socket.on('useProfessionAction', async ({ targetId }) => {
    const actorId = socket.playerData._id;
    const player = await GamePlayer.findById(actorId);

    // 1. Перевіряємо, чи професія взагалі має активку
    if (!player.cards.profession.logic) {
        return socket.emit('error', 'Ваша професія не має активної дії');
    }

    // 2. Виконуємо дію
    const result = await ActionManager.executeProfessionAction(
        actorId, 
        targetId, 
        player.cards.profession.logic
    );

    if (result.success) {
        // 3. Отримуємо оновлений список гравців кімнати
        const updatedPlayers = await GamePlayer.find({ roomCode: player.roomCode });
        
        // 4. Повідомляємо всіх про зміни
        io.to(player.roomCode).emit('gameStateUpdated', { 
            players: updatedPlayers,
            log: `${player.username} використав навичку професії!` 
        });
    } else {
        socket.emit('error', result.message);
    }
});