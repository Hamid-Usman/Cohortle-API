const Sequelize = require("sequelize");
module.exports = function (sequelize, DataTypes) {
    return sequelize.define(
        "partner_contexts",
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
                unique: true,
                references: {
                    model: "users",
                    key: "id",
                },
            },
            learner_types: {
                type: DataTypes.JSON,
                allowNull: true,
            },
            biggest_challenges: {
                type: DataTypes.JSON,
                allowNull: true,
            },
        },
        {
            sequelize,
            tableName: "partner_contexts",
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
                    unique: true,
                    using: "BTREE",
                    fields: [{ name: "user_id" }],
                },
            ],
        },
    );
};
