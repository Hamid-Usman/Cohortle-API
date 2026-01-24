"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("communities", "type", {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "course", // or whatever makes sense
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("communities", "type");
  },
};
