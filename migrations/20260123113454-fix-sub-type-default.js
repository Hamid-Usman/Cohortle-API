"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("communities", "sub_type", {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "general", // choose a sane default
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("communities", "sub_type", {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },
};
