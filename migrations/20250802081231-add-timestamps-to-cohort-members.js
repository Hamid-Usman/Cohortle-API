module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("cohort_members", "created_at", {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.addColumn("cohort_members", "updated_at", {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal(
        "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
      ),
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn("cohort_members", "created_at");
    await queryInterface.removeColumn("cohort_members", "updated_at");
  },
};
