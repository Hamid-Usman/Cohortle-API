module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("communities", "created_at", {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.addColumn("communities", "updated_at", {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal(
        "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
      ),
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn("communities", "created_at");
    await queryInterface.removeColumn("communities", "updated_at");
  },
};
