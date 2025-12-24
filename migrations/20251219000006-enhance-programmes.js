'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Step 1: Remove old foreign key constraint if it exists
        const [foreignKeys] = await queryInterface.sequelize.query(
            `SELECT CONSTRAINT_NAME 
       FROM information_schema.KEY_COLUMN_USAGE 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'programmes' 
       AND COLUMN_NAME = 'community_id'
       AND REFERENCED_TABLE_NAME IS NOT NULL`
        );

        if (foreignKeys.length > 0) {
            try {
                await queryInterface.removeConstraint('programmes', foreignKeys[0].CONSTRAINT_NAME);
            } catch (e) { }
        }

        // Step 2: Add type column if it doesn't exist
        const [typeCols] = await queryInterface.sequelize.query(
            `SHOW COLUMNS FROM programmes LIKE 'type'`
        );
        if (typeCols.length === 0) {
            await queryInterface.addColumn('programmes', 'type', {
                type: Sequelize.ENUM('scheduled', 'structured', 'self_paced'),
                defaultValue: 'scheduled',
                allowNull: false,
                after: 'status'
            });
        }

        // Step 3: Add settings JSON column if it doesn't exist
        const [settingsCols] = await queryInterface.sequelize.query(
            `SHOW COLUMNS FROM programmes LIKE 'settings'`
        );
        if (settingsCols.length === 0) {
            await queryInterface.addColumn('programmes', 'settings', {
                type: Sequelize.JSON,
                allowNull: true,
                comment: 'Type-specific settings',
                after: 'type'
            });
        }

        // Step 4: Re-add foreign key constraint to communities
        try {
            await queryInterface.addConstraint('programmes', {
                fields: ['community_id'],
                type: 'foreign key',
                name: 'fk_programmes_community',
                references: {
                    table: 'communities',
                    field: 'id'
                },
                onDelete: 'CASCADE'
            });
        } catch (e) { }

        // Step 5: Update existing programmes to have default type
        await queryInterface.sequelize.query(
            `UPDATE programmes SET type = 'scheduled' WHERE type IS NULL`
        ).catch(e => { });
    },

    async down(queryInterface, Sequelize) {
        try {
            await queryInterface.removeConstraint('programmes', 'fk_programmes_community');
        } catch (e) { }

        try {
            await queryInterface.removeColumn('programmes', 'settings');
        } catch (e) { }

        try {
            await queryInterface.removeColumn('programmes', 'type');
        } catch (e) { }
    }
};
