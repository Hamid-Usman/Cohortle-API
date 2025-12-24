'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Add created_at and updated_at to community_members if they don't exist
        const [createdAtCols] = await queryInterface.sequelize.query(
            `SHOW COLUMNS FROM community_members LIKE 'created_at'`
        );
        if (createdAtCols.length === 0) {
            await queryInterface.addColumn('community_members', 'created_at', {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            });
        }

        const [updatedAtCols] = await queryInterface.sequelize.query(
            `SHOW COLUMNS FROM community_members LIKE 'updated_at'`
        );
        if (updatedAtCols.length === 0) {
            await queryInterface.addColumn('community_members', 'updated_at', {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
            });
        }
    },

    async down(queryInterface, Sequelize) {
        // Remove created_at and updated_at from community_members
        const [createdAtCols] = await queryInterface.sequelize.query(
            `SHOW COLUMNS FROM community_members LIKE 'created_at'`
        );
        if (createdAtCols.length > 0) {
            await queryInterface.removeColumn('community_members', 'created_at');
        }

        const [updatedAtCols] = await queryInterface.sequelize.query(
            `SHOW COLUMNS FROM community_members LIKE 'updated_at'`
        );
        if (updatedAtCols.length > 0) {
            await queryInterface.removeColumn('community_members', 'updated_at');
        }
    },
};
