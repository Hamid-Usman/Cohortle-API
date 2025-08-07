module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('module_lessons', 'created_at', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    });
    await queryInterface.addColumn('module_lessons', 'updated_at', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
    });
  },
  down: async (queryInterface, Sequelize) => {
  try {
    await queryInterface.removeColumn('module_lessons', 'created_at');
  } catch (e) {
    console.warn('Skipping: created_at does not exist');
  }

  try {
    await queryInterface.removeColumn('module_lessons', 'updated_at');
  } catch (e) {
    console.warn('Skipping: updated_at does not exist');
  }
}
};