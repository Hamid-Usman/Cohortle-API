module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("community_modules", "created_at", {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.addColumn("community_modules", "updated_at", {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal(
        "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
      ),
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn("community_modules", "created_at");
    await queryInterface.removeColumn("community_modules", "updated_at");
  },
};
