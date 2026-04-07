// controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // Підключаємо генератор токенів
const User = require('../models/User');

// --- ФУНКЦІЯ РЕЄСТРАЦІЇ (залишається як була) ---
const registerUser = async (req, res) => {
  try {
    const { username, password } = req.body;
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Гравець з таким ніком вже існує!' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: '✅ Гравця успішно зареєстровано!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '❌ Помилка сервера при реєстрації' });
  }
};

// --- НОВА ФУНКЦІЯ ЛОГІНУ ---
const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1. Шукаємо гравця в базі
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: '❌ Гравця з таким ніком не знайдено!' });
    }

    // 2. Порівнюємо паролі (розшифровуємо хеш)
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: '❌ Невірний пароль!' });
    }

    // 3. Створюємо "перепустку" (токен)
    // У токен ми зашиваємо ID гравця, щоб сервер його впізнавав
    const token = jwt.sign(
      { userId: user._id, username: user.username }, 
      process.env.JWT_SECRET, 
      { expiresIn: '24h' } // Перепустка діє 24 години
    );

    // 4. Віддаємо токен і повідомлення про успіх
    res.status(200).json({ 
      message: '✅ Вхід виконано успішно!', 
      token: token 
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '❌ Помилка сервера при вході' });
  }
};

// Експортуємо обидві функції
module.exports = {
  registerUser,
  loginUser
};