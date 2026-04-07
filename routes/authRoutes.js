// routes/authRoutes.js
const express = require('express');
const router = express.Router();
// Дістаємо обидві функції з контролера
const { registerUser, loginUser } = require('../controllers/authController');

// Маршрут реєстрації
router.post('/register', registerUser);

// Маршрут логіну
router.post('/login', loginUser);

module.exports = router;