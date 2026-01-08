const Sequelize = require("sequelize");
module.exports = function (sequelize, DataTypes) {
    return sequelize.define(
        "discussion_comments",
        {
            id: {
                autoIncrement: true,
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
            },
            discussion_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "discussions",
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
                    model: "discussion_comments",
                    key: "id",
                },
            },
        },
        {
            sequelize,
            tableName: "discussion_comments",
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
