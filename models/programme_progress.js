const Sequelize = require("sequelize");
module.exports = function (sequelize, DataTypes) {
    return sequelize.define(
        "programme_progress",
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
            programme_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "programmes",
                    key: "id",
                },
            },
            cohort_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "cohorts",
                    key: "id",
                },
            },
            total_lessons: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
            },
            completed_lessons: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
            },
            completion_percentage: {
                type: DataTypes.DECIMAL(5, 2),
                defaultValue: 0.0,
            },
            last_activity_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
        },
        {
            sequelize,
            tableName: "programme_progress",
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
