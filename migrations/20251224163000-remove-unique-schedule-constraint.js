'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.removeConstraint('lesson_schedule', 'unique_lesson_cohort_schedule');
    } catch (error) {
      console.warn('Constraint unique_lesson_cohort_schedule not found or already removed.');
    }
  },

  async down(queryInterface, Sequelize) {
    // Irreversible without knowing original logic, skipping re-add
  }
};