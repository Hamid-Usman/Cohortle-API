const Sequelize = require("sequelize");
module.exports = function (sequelize, DataTypes) {
    return sequelize.define(
        "programme_intents",
        {
            id: {
                autoIncrement: true,
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
            },
            user_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "users",
                    key: "id",
                },
            },
            programme_type: {
                type: Sequelize.STRING(255),
                allowNull: false,
            },
            expected_cohort_size: {
                type: Sequelize.STRING(100),
                allowNull: false,
            },
            programme_duration: {
                type: Sequelize.STRING(100),
                allowNull: false,
            },
            mode: {
                type: Sequelize.STRING(100),
                allowNull: false,
            }
        },
        {
            sequelize,
            tableName: "programme_intents",
            timestamps: true,
            createdAt: "created_at",
            updatedAt: "updated_at",
            indexes: [
                {
                    name: "PRIMARY",
                    unique: true,
                    using: "BTREE",
                    fields: [{ name: "id" }],
                },
                {
                    name: "user_id",
                    using: "BTREE",
                    fields: [{ name: "user_id" }],
                },
            ],
        },
    );
};
