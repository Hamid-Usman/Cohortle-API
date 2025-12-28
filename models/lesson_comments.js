const Sequelize = require("sequelize");
module.exports = function (sequelize, DataTypes) {
    return sequelize.define(
        "lesson_comments",
        {
            id: {
                autoIncrement: true,
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
            },
            lesson_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "module_lessons",
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
            cohort_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: "cohorts",
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
                    model: "lesson_comments",
                    key: "id",
                },
            },
        },
        {
            sequelize,
            tableName: "lesson_comments",
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
