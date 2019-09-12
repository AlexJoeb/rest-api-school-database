'use strict';

// Import Sequelize
const Sequelize = require('sequelize');

// Setup Sequelize
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'fsjstd-restapi.db',
});

const db = {
    sequelize,
    Sequelize,
    models: {},
}

// Models
db.models.Course = require("./models/Course.js")(sequelize);
db.models.User = require("./models/User.js")(sequelize);

// Associate
db.models.Course.associate(db.models);
db.models.User.associate(db.models);

module.exports = db;