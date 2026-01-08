const Sequelize = require("sequelize");
module.exports = function (sequelize, DataTypes) {
    return sequelize.define(
        "activity_logs",
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
            action_type: {
                type: DataTypes.ENUM("create", "update", "delete", "enroll", "complete", "comment", "announce"),
                allowNull: false,
            },
            entity_type: {
                type: DataTypes.ENUM("community", "programme", "cohort", "module", "lesson", "member", "discussion", "announcement"),
                allowNull: false,
            },
            entity_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            metadata: {
                type: DataTypes.JSON,
                allowNull: true,
            },
        },
        {
            sequelize,
            tableName: "activity_logs",
            timestamps: true,
            updatedAt: false,
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
