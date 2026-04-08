const socket = io();

// 1. Перевірка авторизації
const token = localStorage.getItem('bunkerToken');
const roomCode = localStorage.getItem('currentRoomCode');

if (!token || !roomCode) {
    window.location.href = 'lobby.html';
}
let playersInRoom = [];
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
    playersInRoom = data.players;
    renderMyCards(data.players);    
    console.log(data.players)
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
// public/game.js

let currentActionLogic = null; // Запам'ятовуємо логіку, поки вибираємо ціль

function handleProfessionAction(logic) {
    if (logic.target === "SELECT") {
        currentActionLogic = logic;
        openTargetModal();
    }
}

function openTargetModal() {
    const modal = document.getElementById('targetModal');
    const list = document.getElementById('targetList');
    list.innerHTML = '';

    // Беремо всіх гравців, крім себе (бо навряд чи ти хочеш лікувати самого себе)
    const opponents = playersInRoom.filter(p => p.userId !== myUserId);

    opponents.forEach(player => {
        const btn = document.createElement('button');
        btn.className = 'target-btn';
        btn.innerText = player.username;
        btn.onclick = () => selectTarget(player._id);
        list.appendChild(btn);
    });

    modal.style.display = 'flex';
}

function selectTarget(targetId) {
    socket.emit('useProfessionAction', { targetId });
    closeTargetModal();
}

function closeTargetModal() {
    document.getElementById('targetModal').style.display = 'none';
    currentActionLogic = null;
}



// Функція для визначення статусу тіла
function getBodyStatus(height, weight) {
    const bmi = weight / ((height / 100) ** 2);
    if (bmi < 18.5) return "Хвороблива худорлявість";
    if (bmi < 25)   return "Ідеальна статура";
    if (bmi < 30)   return "Легка надмірна вага";
    if (bmi < 35)   return "Ожиріння I ступеня";
    return "Сильне ожиріння";
}

// public/game.js

function renderMyCards(players) {
    const content = document.getElementById('myCardsContent');
    if (!content || !players) return;

    const me = players.find(p => p.userId === myUserId);
    if (!me || !me.cards) return;

    const { profession, bio, phobia, body, health, hobby, character, extraInfo, inventorySmall, inventoryBig } = me.cards;
    const bodyStatus = getBodyStatus(body.height, body.weight);
    const renderItems = (items, icon) => {
        if (!items || items.length === 0) return `<p style="color: #666;">Порожньо</p>`;
        return items.map(item => `
            <div class="item-entry">
                ${icon} <strong>${item.name}</strong>
            </div>
        `).join('');
    };
    const cards = me.cards;
    content.innerHTML = `
        <div class="card-item prof-border">
            <div class="card-body-wrapper">
                <div class="card-main-info">
                    <div class="card-tag">Професія ${profession?.experience ? `• ${profession.experience.label}` : ''}</div>
                    ${profession ? `
                        <h4>💼 ${profession.name}</h4>
                        <p>${profession.description}</p>
                        <small style="color: #3498db;">Стаж: ${profession.experience?.years || 0} років</small>
                    ` : `<h4>💼 Безробітний</h4>`}
                </div>
                <div class="card-status-zone" id="status-prof"></div>
            </div>
            ${profession?.logic ? `
                <button class="action-btn" onclick='handleProfessionAction(${JSON.stringify(profession.logic)})'>
                    ⚡ Використати навичку
                </button>
            ` : ''}
        </div>

        <div class="card-item health-border">
            <div class="card-body-wrapper">
                <div class="card-main-info">
                    <div class="card-tag">Стан здоров'я</div>
                    ${health ? `
                        <h4>❤️ ${health.name}</h4>
                        <p>${health.description} <i>(Рівень: ${health.danger_level})</i></p>
                    ` : `<h4>✨ Абсолютно здоровий</h4><p style="opacity:0.6">Жодних симптомів</p>`}
                </div>
                <div class="card-status-zone" id="status-health"></div>
            </div>
        </div>

        <div class="card-item phobia-border">
            <div class="card-body-wrapper">
                <div class="card-main-info">
                    <div class="card-tag">Фобія</div>
                    ${phobia ? `
                        <h4>😱 ${phobia.name}</h4>
                        <p style="font-style: italic; font-size: 0.8rem; opacity: 0.7;">Психологічний бар'єр</p>
                    ` : `<h4>🧠 Психіка стабільна</h4>`}
                </div>
                <div class="card-status-zone" id="status-phobia"></div>
            </div>
        </div>

        <div class="card-item hobby-border">
            <div class="card-body-wrapper">
                <div class="card-main-info">
                    <div class="card-tag">Хобі ${hobby?.experience ? `• ${hobby.experience.label}` : ''}</div>
                    ${hobby ? `
                        <h4>🎸 ${hobby.name}</h4>
                        <small style="color: #1abc9c;">Досвід: ${hobby.experience?.years || 0} років</small>
                    ` : `<h4>🤷‍♂️ Без захоплень</h4>`}
                </div>
                <div class="card-status-zone" id="status-hobby"></div>
            </div>
        </div>

        <div class="card-item small-item-border">
            <div class="card-main-info">
                <div class="card-tag">Малий багаж</div>
                <div class="items-list">
                    ${(inventorySmall && inventorySmall.length > 0) 
                        ? renderItems(inventorySmall, '🎒') 
                        : '<p style="color: #666;">Порожньо</p>'}
                </div>
            </div>
        </div>

        <div class="card-item big-item-border">
            <div class="card-main-info">
                <div class="card-tag">Великий багаж</div>
                <div class="items-list">
                    ${(inventoryBig && inventoryBig.length > 0) 
                        ? renderItems(inventoryBig, '📦') 
                        : '<p style="color: #666;">Порожньо</p>'}
                </div>
            </div>
        </div>

        <div class="card-item character-border">
            <div class="card-main-info">
                <div class="card-tag">Риса характеру</div>
                ${character ? `
                    <h4>🎭 ${character.name}</h4>
                    <p style="font-size: 0.8rem; color: #888;">Модель поведінки</p>
                ` : `<h4>😶 Без особливостей</h4>`}
            </div>
        </div>

        <div class="card-item extra-border">
            <div class="card-main-info">
                <div class="card-tag">Додаткова інформація</div>
                ${extraInfo ? `
                    <h4>🔍 ${extraInfo.name}</h4>
                ` : `<h4>📂 Дані відсутні</h4>`}
            </div>
        </div>

        <div class="card-item bio-border">
            <div class="card-main-info">
                <div class="card-tag">Біологічні дані</div>
                ${bio ? `
                    <h4>🧬 ${bio.gender}, ${bio.age} років</h4>
                    <p>Орієнтація: ${bio.orientation}</p>
                ` : `<h4>🧬 Дані засекречені</h4>`}
            </div>
        </div>

        <div class="card-item body-border">
            <div class="card-main-info">
                <div class="card-tag">Фізичні дані</div>
                ${body ? `
                    <h4>⚖️ ${body.height} см / ${body.weight} кг</h4>
                    <p>Статус: <strong>${bodyStatus}</strong></p>
                ` : `<h4>⚖️ Невідомо</h4>`}
            </div>
        </div>
    `;
}

function confirmLeave() {
    if (confirm("Ви впевнені, що хочете покинути гру? Ваш персонаж буде видалений.")) {
        // Відправляємо сигнал серверу про свідомий вихід
        socket.emit('leaveGame', { roomCode, userId: myUserId });
        
        // Очищаємо локальні дані та йдемо в лобі
        localStorage.removeItem('currentRoomCode');
        window.location.href = 'lobby.html';
    }
}