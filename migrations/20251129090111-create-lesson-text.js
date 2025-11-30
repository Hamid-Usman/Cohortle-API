'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("module_lessons", "text", {
      type: Sequelize.TEXT,
      allowNull: true,
      defaultValue: ""
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("module_lessons", "text");
  }
};
