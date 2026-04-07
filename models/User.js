// Підключаємо mongoose
const mongoose = require('mongoose');

// Створюємо схему (креслення) для нашого користувача
const userSchema = new mongoose.Schema({
  username: {
    type: String, // Логін буде текстом
    required: true, // Це поле обов'язкове (без нього не зареєструє)
    unique: true // Логін має бути унікальним (щоб не було двох Вась)
  },
  password: {
    type: String, // Пароль теж текст (ми його потім будемо шифрувати)
    required: true
  }
}, { 
  timestamps: true // Ця штука автоматично додасть дату реєстрації гравця
});

// Перетворюємо схему на Модель і дозволяємо іншим файлам її використовувати
module.exports = mongoose.model('User', userSchema);