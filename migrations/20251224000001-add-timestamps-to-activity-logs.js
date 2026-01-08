'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        // Add created_at to activity_logs if it doesn't exist
        const [createdAtCols] = await queryInterface.sequelize.query(
            `SHOW COLUMNS FROM activity_logs LIKE 'created_at'`
        );
        if (createdAtCols.length === 0) {
            await queryInterface.addColumn('activity_logs', 'created_at', {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            });
        }

        // Add updated_at to activity_logs if it doesn't exist
        const [updatedAtCols] = await queryInterface.sequelize.query(
            `SHOW COLUMNS FROM activity_logs LIKE 'updated_at'`
        );
        if (updatedAtCols.length === 0) {
            await queryInterface.addColumn('activity_logs', 'updated_at', {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
            });
        }
    },

    async down(queryInterface, Sequelize) {
        // Remove updated_at
        const [updatedAtCols] = await queryInterface.sequelize.query(
            `SHOW COLUMNS FROM activity_logs LIKE 'updated_at'`
        );
        if (updatedAtCols.length > 0) {
            await queryInterface.removeColumn('activity_logs', 'updated_at');
        }

        // Remove created_at
        const [createdAtCols] = await queryInterface.sequelize.query(
            `SHOW COLUMNS FROM activity_logs LIKE 'created_at'`
        );
        if (createdAtCols.length > 0) {
            await queryInterface.removeColumn('activity_logs', 'created_at');
        }
    }
};