'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Add role column to cohort_members
        await queryInterface.addColumn('cohort_members', 'role', {
            type: Sequelize.ENUM('learner', 'instructor', 'facilitator'),
            defaultValue: 'learner',
            allowNull: false,
            after: 'user_id'
        });

        // Add enrolled_at column
        await queryInterface.addColumn('cohort_members', 'enrolled_at', {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            after: 'role'
        });

        // Update existing records to have learner role
        await queryInterface.sequelize.query(
            `UPDATE cohort_members SET role = 'learner' WHERE role IS NULL`
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('cohort_members', 'enrolled_at');
        await queryInterface.removeColumn('cohort_members', 'role');
    }
};
