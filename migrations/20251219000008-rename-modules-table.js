'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Check if community_modules exists before renaming
        const [tables] = await queryInterface.sequelize.query(
            `SHOW TABLES LIKE 'community_modules'`
        );

        if (tables.length > 0) {
            // Step 1: Rename table from community_modules to programme_modules
            await queryInterface.renameTable('community_modules', 'programme_modules');
        }

        // Check if programme_modules exists (might have been renamed in a previous run)
        const [progTables] = await queryInterface.sequelize.query(
            `SHOW TABLES LIKE 'programme_modules'`
        );

        if (progTables.length > 0) {
            // Step 2: Drop old foreign key constraint
            const [foreignKeys] = await queryInterface.sequelize.query(
                `SELECT CONSTRAINT_NAME 
           FROM information_schema.KEY_COLUMN_USAGE 
           WHERE TABLE_SCHEMA = DATABASE() 
           AND TABLE_NAME = 'programme_modules' 
           AND COLUMN_NAME = 'community_id'
           AND REFERENCED_TABLE_NAME IS NOT NULL`
            );

            if (foreignKeys.length > 0) {
                await queryInterface.removeConstraint('programme_modules', foreignKeys[0].CONSTRAINT_NAME);
            }

            // Step 3: Rename community_id to programme_id if community_id still exists
            const [columns] = await queryInterface.sequelize.query(
                `SHOW COLUMNS FROM programme_modules LIKE 'community_id'`
            );

            if (columns.length > 0) {
                await queryInterface.renameColumn('programme_modules', 'community_id', 'programme_id');
            }

            // Step 4: Add new foreign key constraint
            try {
                await queryInterface.addConstraint('programme_modules', {
                    fields: ['programme_id'],
                    type: 'foreign key',
                    name: 'fk_programme_modules_programme',
                    references: {
                        table: 'programmes',
                        field: 'id'
                    },
                    onDelete: 'CASCADE'
                });
            } catch (error) {
                // Constraint might already exist
            }

            // Step 5: Drop old index if it exists
            try {
                await queryInterface.removeIndex('programme_modules', 'community_id');
            } catch (error) {
                // Index might not exist
            }

            // Step 6: Add new index
            try {
                await queryInterface.addIndex('programme_modules', ['programme_id'], {
                    name: 'idx_programme_id'
                });
            } catch (error) {
                // Index might already exist
            }
        }
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeIndex('programme_modules', 'idx_programme_id');
        await queryInterface.removeConstraint('programme_modules', 'fk_programme_modules_programme');
        await queryInterface.renameColumn('programme_modules', 'programme_id', 'community_id');
        await queryInterface.renameTable('programme_modules', 'community_modules');
    }
};
