const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define(
    "lesson_progress",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      learner_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "learners",
          key: "id",
        },
      },
      lesson_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "module_lessons",
          key: "id",
        },
      },
      cohort_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "cohorts",
          key: "id",
        },
      },
      completed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      completed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "lesson_progress",
      timestamps: false, // disable automatic timestamps since you defined them manually
    }
  );
};
