// models/index.js
const fs = require('fs');
const path = require('path');

const models = {};
const baseName = path.basename(__filename);

// Зчитуємо всі файли в поточній директорії
fs.readdirSync(__dirname)
    .filter(file => {
        // Беремо тільки .js файли і ігноруємо цей файл (index.js)
        return (file.indexOf('.') !== 0) && (file !== baseName) && (file.slice(-3) === '.js');
    })
    .forEach(file => {
        const model = require(path.join(__dirname, file));
        // Записуємо модель в об'єкт (наприклад, models.Profession)
        models[model.modelName] = model;
    });

module.exports = models;