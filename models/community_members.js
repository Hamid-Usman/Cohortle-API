const Sequelize = require("sequelize");
module.exports = function (sequelize, DataTypes) {
    return sequelize.define(
        "community_members",
        {
            id: {
                autoIncrement: true,
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
            },
            community_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "communities",
                    key: "id",
                },
            },
            user_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "users",
                    key: "id",
                },
            },
            role: {
                type: DataTypes.STRING(255),
                allowNull: false,
                defaultValue: "learner",
            },
            status: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
        },
        {
            sequelize,
            tableName: "community_members",
            timestamps: true,
            indexes: [
                {
                    name: "PRIMARY",
                    unique: true,
                    using: "BTREE",
                    fields: [{ name: "id" }],
                },
                {
                    name: "community_id",
                    using: "BTREE",
                    fields: [{ name: "community_id" }],
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
