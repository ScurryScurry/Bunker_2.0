// public/lobby.js

// 1. Перевіряємо, чи є токен. Якщо ні - кидаємо на логін
const token = localStorage.getItem('bunkerToken');
if (!token) window.location.href = 'login.html';

// 2. Розшифровуємо токен, щоб дістати ім'я ТА ID гравця
const payload = JSON.parse(atob(token.split('.')[1]));
const myUsername = payload.username;
const myUserId = payload.userId; 

// Виводимо ім'я гравця на екран
document.getElementById('playerName').innerText = myUsername;

// 3. Підключаємося до сервера через WebSockets
const socket = io();

// --- ВІДПРАВКА КОМАНД НА СЕРВЕР ---

document.getElementById('createBtn').addEventListener('click', () => {
    const mode = document.getElementById('gameMode').value;
    socket.emit('createRoom', { userId: myUserId, username: myUsername, mode: mode });
});

document.getElementById('joinBtn').addEventListener('click', () => {
    const code = document.getElementById('roomCodeInput').value.toUpperCase();
    if (code.length > 0) {
        socket.emit('joinRoom', { userId: myUserId, username: myUsername, roomCode: code });
    }
});

document.getElementById('startGameBtn').addEventListener('click', () => {
    const code = document.getElementById('displayRoomCode').innerText;
    socket.emit('startGame', { roomCode: code, userId: myUserId });
});

// --- ЛОВИМО ВІДПОВІДІ ВІД СЕРВЕРА ---

// Коли сервер підтвердив, що КІМНАТУ СТВОРЕНО (для адміна)
socket.on('roomCreated', (data) => {
    console.log("Кімнату створено:", data.roomCode);
    // ПЕРЕМИКАЄМО ЕКРАН
    showRoomScreen(data.roomCode, data.room);
});

// Коли ми підключилися як ГІСТЬ
socket.on('roomJoined', (data) => {
    console.log("Ви приєдналися до:", data.roomCode);
    // ПЕРЕМИКАЄМО ЕКРАН
    showRoomScreen(data.roomCode, data.room);
});

// Коли хтось інший зайшов/вийшов (оновлення списку для всіх)
socket.on('roomUpdated', (room) => {
    updatePlayersList(room.players);
});
socket.on('gameStarted', () => {
    // Зберігаємо код, щоб сторінка game.html знала, до якої сесії підключитися
    const code = document.getElementById('displayRoomCode').innerText;
    localStorage.setItem('currentRoomCode', code);
    
    // Перекидаємо всіх на ігрове поле
    window.location.href = 'game.html';
});
// --- ФУНКЦІЇ ДЛЯ МАЛЮВАННЯ ІНТЕРФЕЙСУ ---

function showRoomScreen(code, room) {
    document.getElementById('menuScreen').classList.add('hidden');
    document.getElementById('roomScreen').classList.remove('hidden');
    
    document.getElementById('displayRoomCode').innerText = code;
    document.getElementById('displayMode').innerText = room.mode === 'online' ? 'Онлайн' : 'Вживу';
    
    // ПЕРЕВІРКА НА АДМІНА: Якщо наш ID співпадає з ID творця кімнати
    if (room.hostId === myUserId) {
        document.getElementById('startGameBtn').classList.remove('hidden'); // Показуємо кнопку
    }
    
    updatePlayersList(room.players);
}

function updatePlayersList(players) {
    const list = document.getElementById('playersList');
    list.innerHTML = ''; // Очищаємо старий список
    
    players.forEach(p => {
        const li = document.createElement('li');
        li.innerText = `👤 ${p.username}`;
        list.appendChild(li);
    });
}


// Коли прийшла відповідь (успіх або помилка) — розблоковуємо (хоча при успіху нас перекине)
socket.on('roomCreated', (data) => {
    isCreating = false;
    showRoomScreen(data.roomCode, data.room);
});

socket.on('error', (msg) => {
    isCreating = false;
    const btn = document.getElementById('createBtn');
    btn.disabled = false;
    btn.innerText = "Створити кімнату";
    document.getElementById('errorMessage').innerText = msg;
});