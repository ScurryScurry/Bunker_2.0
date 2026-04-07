// models/Profession.js
const mongoose = require('mongoose');

const professionSchema = new mongoose.Schema({
    _id: String,            // String, бо ти юзаєш кастомні ID типу 'cls_traumatologist'
    pack_id: String,
    name: String,
    description: String,
    type: String,           // 'ACTION', 'PASSIVE', 'NEUTRAL' тощо
    logic: { type: Object } // Object ідеально підходить для гнучких JSON-конфігів
});

// Увага: третій аргумент 'Professions' — це точна назва твоєї колекції в MongoDB. 
// Якщо в тебе вона називається інакше (наприклад 'Cards_profession'), обов'язково зміни!
module.exports = mongoose.model('Profession', professionSchema, 'Profesions');