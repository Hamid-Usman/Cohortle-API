const Sequelize = require("sequelize");
module.exports = function (sequelize, DataTypes) {
    return sequelize.define(
        "lesson_schedule",
        {
            id: {
                autoIncrement: true,
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
            },
            title: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            meeting_link: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            cohort_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "cohorts",
                    key: "id",
                },
            },
            scheduled_date: {
                type: DataTypes.DATEONLY,
                allowNull: false,
            },
            scheduled_time: {
                type: DataTypes.TIME,
                allowNull: true,
            },
            duration_minutes: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
        },
        {
            sequelize,
            tableName: "lesson_schedule",
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
