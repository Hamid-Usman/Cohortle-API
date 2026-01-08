const Sequelize = require("sequelize");
module.exports = function (sequelize, DataTypes) {
    return sequelize.define(
        "discussions",
        {
            id: {
                autoIncrement: true,
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
            },
            programme_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: "programmes",
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
            lesson_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: "module_lessons",
                    key: "id",
                },
            },
            title: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            created_by: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "users",
                    key: "id",
                },
            },
            is_pinned: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
        },
        {
            sequelize,
            tableName: "discussions",
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
