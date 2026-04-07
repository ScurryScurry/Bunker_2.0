const socket = io();

// 1. Перевірка авторизації
const token = localStorage.getItem('bunkerToken');
const roomCode = localStorage.getItem('currentRoomCode');

if (!token || !roomCode) {
    window.location.href = 'lobby.html';
}

const payload = JSON.parse(atob(token.split('.')[1]));
const myUserId = payload.userId;
const myUsername = payload.username;

// 2. Сигналізуємо серверу, що ми завантажились
socket.emit('playerReadyInGame', {
    roomCode: roomCode,
    userId: myUserId,
    username: myUsername
});

// 3. Слухаємо події
socket.on('error', (msg) => {
    alert(msg);
    window.location.href = 'lobby.html';
});
socket.on('playerLoaded', (data) => {
    document.getElementById('gameRoomCode').innerText = roomCode;
    renderPlayers(data.players);
    if (data.disasterData) renderDisaster(data.disasterData);
    if (data.bunkerData) renderBunker(data.bunkerData);
});

function renderPlayers(players) {
    const container = document.getElementById('playersHeaderList');
    if (!container) return;
    container.innerHTML = players.map(p => `
        <div class="player-chip ${p.userId === myUserId ? 'is-me' : ''}">
            👤 ${p.username}
        </div>
    `).join('');
}

function renderDisaster(disaster) {
    const container = document.getElementById('disasterInfo');
    if (!container) return;
    
    let color = disaster.destructionLevel > 70 ? '#e74c3c' : '#f39c12';

    container.innerHTML = `
        <div class="info-block" style="border-top: 4px solid ${color}">
            <div style="display:flex; justify-content:space-between">
                <h2 style="margin:0; color:${color}">🌋 ${disaster.name}</h2>
                <b>${disaster.destructionLevel}% руйнувань</b>
            </div>
            <p>${disaster.description}</p>
            <small>⏳ Режим ізоляції: ${disaster.duration} років</small>
        </div>
    `;
}

function renderBunker(bunker) {
    const content = document.getElementById('bunkerContent');
    if (!content) return;

    const rooms = bunker.rooms.map(room => {
        let stateColor = room.stateLabel.includes("Ідеал") ? "#2ecc71" : "#f1c40f";
        if (room.stateLabel.includes("Зруй") || room.stateLabel.includes("Пога")) stateColor = "#e74c3c";

        return `
            <div class="room-item" style="border-left-color: ${stateColor}" onclick="this.classList.toggle('is-open')">
                <div style="display:flex; justify-content:space-between">
                    <strong>🚪 ${room.name}</strong>
                    <span style="color:${stateColor}; font-size:0.8rem">${room.stateLabel}</span>
                </div>
                <div class="details">
                    ${room.description}<br>
                    <i style="color:#777">Статус: ${room.stateDescription}</i>
                </div>
            </div>
        `;
    }).join('');

    content.innerHTML = `
        <p><strong>${bunker.name}</strong>: ${bunker.description}</p>
        <div style="background:rgba(243,156,18,0.1); padding:10px; border-radius:5px; margin-bottom:15px">
            <b style="color:#f39c12">Особливість:</b> ${bunker.feature.name}<br>
            <small>${bunker.feature.effect}</small>
        </div>
        <div>${rooms}</div>
    `;
}