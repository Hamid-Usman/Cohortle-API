"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // await queryInterface.addColumn("cohorts", "url", {
    //   type: Sequelize.STRING(255),
    //   allowNull: true,
    // });

    await queryInterface.addColumn("cohorts", "owner_type", {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    await queryInterface.addColumn("cohorts", "description", {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    // await queryInterface.addColumn("cohorts", "annual_revenue", {
    //   type: Sequelize.STRING(255),
    //   allowNull: true,
    // });

    // await queryInterface.addColumn("cohorts", "referral_source", {
    //   type: Sequelize.STRING(255),
    //   allowNull: true,
    // });

    await queryInterface.addColumn("cohorts", "community_structure", {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("cohorts", "url");
    // await queryInterface.removeColumn("cohorts", "owner_type");
    await queryInterface.removeColumn("cohorts", "description");
    // await queryInterface.removeColumn("cohorts", "annual_revenue");
    // await queryInterface.removeColumn("cohorts", "referral_source");
    await queryInterface.removeColumn("cohorts", "community_structure");
  },
};
