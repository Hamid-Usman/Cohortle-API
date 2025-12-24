'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Fix lesson_progress table - change learner_id to user_id

        // First, check if the foreign key exists and drop it
        const [foreignKeys] = await queryInterface.sequelize.query(
            `SELECT CONSTRAINT_NAME 
       FROM information_schema.KEY_COLUMN_USAGE 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'lesson_progress' 
       AND COLUMN_NAME = 'learner_id'
       AND REFERENCED_TABLE_NAME IS NOT NULL`
        );

        if (foreignKeys.length > 0) {
            await queryInterface.removeConstraint('lesson_progress', foreignKeys[0].CONSTRAINT_NAME);
        }

        // Rename column
        await queryInterface.renameColumn('lesson_progress', 'learner_id', 'user_id');

        // Add proper foreign key
        await queryInterface.addConstraint('lesson_progress', {
            fields: ['user_id'],
            type: 'foreign key',
            name: 'fk_lesson_progress_user',
            references: {
                table: 'users',
                field: 'id'
            },
            onDelete: 'CASCADE'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeConstraint('lesson_progress', 'fk_lesson_progress_user');
        await queryInterface.renameColumn('lesson_progress', 'user_id', 'learner_id');
    }
};
