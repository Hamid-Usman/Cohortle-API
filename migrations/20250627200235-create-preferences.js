"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("preferences", {
      id: {
        autoIncrement: true,
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      email_updates: {
        type: Sequelize.TINYINT,
        allowNull: false,
      },
      new_posts: {
        type: Sequelize.TINYINT,
        allowNull: false,
      },
      new_course_content: {
        type: Sequelize.TINYINT,
        allowNull: false,
      },
      new_polls: {
        type: Sequelize.TINYINT,
        allowNull: false,
      },
      mentions: {
        type: Sequelize.TINYINT,
        allowNull: false,
      },
      replies_on_post: {
        type: Sequelize.TINYINT,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("preferences");
  },
};
