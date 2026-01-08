const Sequelize = require("sequelize");
module.exports = function (sequelize, DataTypes) {
    return sequelize.define(
        "announcement_comments",
        {
            id: {
                autoIncrement: true,
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
            },
            announcement_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "announcements",
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
            comment_text: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            parent_comment_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: "announcement_comments",
                    key: "id",
                },
            },
        },
        {
            sequelize,
            tableName: "announcement_comments",
            timestamps: true,
            indexes: [
                {
                    name: "PRIMARY",
                    unique: true,
                    using: "BTREE",
                    fields: [{ name: "id" }],
                },
            ],
        },
    );
};
