"use strict";

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable("programmes", {
            id: {
                autoIncrement: true,
                type: Sequelize.INTEGER,
                allowNull: false,
                primaryKey: true,
            },
            community_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "communities",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            name: {
                type: Sequelize.STRING(255),
                allowNull: false,
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            start_date: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            end_date: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            metadata: {
                type: Sequelize.JSON,
                allowNull: true,
            },
            status: {
                type: Sequelize.STRING(100),
                allowNull: false,
                defaultValue: "draft",
            },
            created_by: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            thumbnail: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
            },
        });

        await queryInterface.addIndex("programmes", ["community_id"]);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable("programmes");
    },
};
