"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("cohorts", "description", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn("cohorts", "goal", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn("cohorts", "revenue", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn("cohorts", "referral", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("cohorts", "description");
    await queryInterface.removeColumn("cohorts", "goal");
    await queryInterface.removeColumn("cohorts", "revenue");
    await queryInterface.removeColumn("cohorts", "referral");
  },
};
