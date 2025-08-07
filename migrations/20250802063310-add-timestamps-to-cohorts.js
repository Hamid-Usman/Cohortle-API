module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('cohorts', 'created_at', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    });
    await queryInterface.addColumn('cohorts', 'updated_at', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('cohorts', 'created_at');
    await queryInterface.removeColumn('cohorts', 'updated_at');
  }
};