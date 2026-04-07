// public/login.js
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault(); 
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const messageDiv = document.getElementById('message');

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            messageDiv.style.color = 'lightgreen';
            messageDiv.innerText = data.message;
            
            // Зберігаємо токен
            localStorage.setItem('bunkerToken', data.token);
            
            // Миттєвий перехід у лобі
            window.location.href = 'lobby.html';
        }

        else {
            messageDiv.style.color = 'salmon';
            messageDiv.innerText = data.message;
        }
    } catch (error) {
        messageDiv.style.color = 'red';
        messageDiv.innerText = 'Помилка з\'єднання з сервером';
    }
});