// Import Sequelize
const Sequelize = require('sequelize');

module.exports = (sequelize) => {
    class User extends Sequelize.Model {}

    User.init({
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        firstName: {
            type: Sequelize.STRING,
            allowNull: false,
            validate: {
                notNull: {
                    msg: "No value was found for first name.",
                },
                notEmpty: {
                    msg: "No value was found for first name.",
                }
            }
        },

        lastName: {
            type: Sequelize.STRING,
            allowNull: false,
            validate: {
                notNull: {
                    msg: "No value was found for last name.",
                },
                notEmpty: {
                    msg: "No value was found for last name.",
                }
            }
        },

        emailAddress: {
            type: Sequelize.STRING,
            allowNull: false,
            validate: {
                notNull: {
                    msg: "No value was found for e-mail address.",
                },
                notEmpty: {
                    msg: "No value was found for e-mail address.",
                }
            }
        },

        password: {
            type: Sequelize.STRING,
            allowNull: false,
            validate: {
                notNull: {
                    msg: "No value was found for password.",
                },
                notEmpty: {
                    msg: "No value was found for password.",
                }
            }
        },

        createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            validate: {
                notNull: {
                    msg: "No value was found for create at.",
                },
                notEmpty: {
                    msg: "No value was found for create at.",
                }
            }
        },

        updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            validate: {
                notNull: {
                    msg: "No value was found for updated at.",
                },
                notEmpty: {
                    msg: "No value was found for updated at.",
                }
            }
        },
    }, {sequelize});

    User.associate = (models) => {
        User.hasMany(models.Course, {
            foreignKey: {
                fieldName: 'userId',
                allowNull: false,
            },
        });
    }

    return User;
}