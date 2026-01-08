'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Add estimated_duration and is_required to module_lessons
        await queryInterface.addColumn('module_lessons', 'estimated_duration', {
            type: Sequelize.INTEGER,
            allowNull: true,
            comment: 'Duration in minutes',
            after: 'order_number'
        });

        await queryInterface.addColumn('module_lessons', 'is_required', {
            type: Sequelize.BOOLEAN,
            defaultValue: true,
            allowNull: false,
            after: 'estimated_duration'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('module_lessons', 'is_required');
        await queryInterface.removeColumn('module_lessons', 'estimated_duration');
    }
};
