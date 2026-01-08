"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("lesson_progress", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      learner_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      lesson_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "module_lessons", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      cohort_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "cohorts", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      completed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("lesson_progress");
  },
};
