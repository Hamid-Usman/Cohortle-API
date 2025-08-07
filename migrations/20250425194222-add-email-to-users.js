"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("users", "email", {
      type: Sequelize.STRING(255),
      allowNull: false,
      unique: true,
    });
    await queryInterface.addColumn("users", "email_verified", {
      type: Sequelize.TINYINT(1),
      allowNull: false,
      defaultValue: 0,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("users", "email");
    await queryInterface.removeColumn("users", "email_verified");
  },
};
