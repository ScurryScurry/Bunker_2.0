// config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Підключаємося до бази
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ База даних успішно підключена!');
  } catch (error) {
    console.error('❌ Помилка підключення до бази:', error.message);
    process.exit(1); // Зупиняємо сервер, якщо база впала
  }
};

module.exports = connectDB;