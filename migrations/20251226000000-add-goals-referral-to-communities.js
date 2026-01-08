'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('communities', 'goals', {
            type: Sequelize.TEXT,
            allowNull: true,
        });

        await queryInterface.addColumn('communities', 'referral', {
            type: Sequelize.STRING,
            allowNull: true,
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('communities', 'goals');
        await queryInterface.removeColumn('communities', 'referral');
    }
};
