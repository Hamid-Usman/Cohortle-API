'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      'lesson_schedule',
      'meeting_link',
      {
        type: Sequelize.STRING(255),
        allowNull: true,
      }
    );

    await queryInterface.removeColumn(
      'lesson_schedule',
      'lesson_id'
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      'lesson_schedule',
      'lesson_id',
      {
        type: Sequelize.STRING, // use the ORIGINAL type
        allowNull: true,        // match original constraints
      }
    );

    await queryInterface.removeColumn(
      'lesson_schedule',
      'meeting_link'
    );
  },
};
