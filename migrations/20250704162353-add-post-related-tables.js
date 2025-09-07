"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("posts", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },

      text: {
        type: Sequelize.TEXT,
        allowNull: false,
      },

      media_1: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      media_2: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      media_3: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      media_4: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      community_ids: {
        type: Sequelize.STRING, // storing comma-separated IDs
        allowNull: true,
      },
      mentioned_ids: {
        type: Sequelize.STRING, // storing comma-separated IDs
        allowNull: true,
      },

      can_reply: {
        type: Sequelize.ENUM("everyone", "followers", "mentioned"),
        allowNull: false,
      },

      status: {
        type: Sequelize.ENUM("PUBLISHED", "DRAFT", "ARCHIVED"),
        allowNull: false,
        defaultValue: "PUBLISHED",
      },

      posted_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users", // assumes you already have a users table
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },

      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    // drop ENUMs first to avoid errors in Postgres
    await queryInterface.dropTable("posts");
    await queryInterface.sequelize.query("DROP TYPE IF EXISTS enum_posts_can_reply;");
    await queryInterface.sequelize.query("DROP TYPE IF EXISTS enum_posts_status;");
  },
};
