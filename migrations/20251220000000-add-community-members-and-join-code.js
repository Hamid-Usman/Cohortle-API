"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Add join_code to communities if it doesn't exist
        const [joinCodeCols] = await queryInterface.sequelize.query(
            `SHOW COLUMNS FROM communities LIKE 'join_code'`
        );
        if (joinCodeCols.length === 0) {
            await queryInterface.addColumn("communities", "join_code", {
                type: Sequelize.STRING,
                allowNull: true,
                unique: true,
            });
        }

        // Create community_members table if it doesn't exist
        const [tables] = await queryInterface.sequelize.query(
            `SHOW TABLES LIKE 'community_members'`
        );

        if (tables.length === 0) {
            await queryInterface.createTable("community_members", {
                id: {
                    allowNull: false,
                    autoIncrement: true,
                    primaryKey: true,
                    type: Sequelize.INTEGER,
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
                user_id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    references: {
                        model: "users",
                        key: "id",
                    },
                    onUpdate: "CASCADE",
                    onDelete: "CASCADE",
                },
                role: {
                    type: Sequelize.STRING,
                    allowNull: false,
                    defaultValue: "learner",
                },
                status: {
                    type: Sequelize.STRING,
                    allowNull: true,
                },
                createdAt: {
                    allowNull: false,
                    type: Sequelize.DATE,
                    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
                },
                updatedAt: {
                    allowNull: false,
                    type: Sequelize.DATE,
                    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
                },
            });

            // Add indexes for community_members
            try {
                await queryInterface.addIndex("community_members", ["community_id"]);
                await queryInterface.addIndex("community_members", ["user_id"]);
            } catch (e) { }
        }
    },

    async down(queryInterface, Sequelize) {
        try {
            await queryInterface.dropTable("community_members");
        } catch (e) { }

        try {
            const [joinCodeCols] = await queryInterface.sequelize.query(
                `SHOW COLUMNS FROM communities LIKE 'join_code'`
            );
            if (joinCodeCols.length > 0) {
                await queryInterface.removeColumn("communities", "join_code");
            }
        } catch (e) { }
    },
};
