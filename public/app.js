// public/app.js
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault(); 
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const messageDiv = document.getElementById('message');

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            messageDiv.style.color = 'lightgreen';
            messageDiv.innerText = data.message;
            document.getElementById('registerForm').reset(); // Очищаємо форму після успіху
        } else {
            messageDiv.style.color = 'salmon';
            messageDiv.innerText = data.message;
        }
    } catch (error) {
        messageDiv.style.color = 'red';
        messageDiv.innerText = 'Помилка з\'єднання з сервером';
    }
});