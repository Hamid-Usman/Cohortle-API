'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('lesson_comments', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false
            },
            lesson_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'module_lessons',
                    key: 'id'
                },
                onDelete: 'CASCADE'
            },
            user_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onDelete: 'CASCADE'
            },
            cohort_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'cohorts',
                    key: 'id'
                },
                onDelete: 'CASCADE'
            },
            comment_text: {
                type: Sequelize.TEXT,
                allowNull: false
            },
            parent_comment_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'lesson_comments',
                    key: 'id'
                },
                onDelete: 'CASCADE'
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
            }
        });

        await queryInterface.addIndex('lesson_comments', ['lesson_id']);
        await queryInterface.addIndex('lesson_comments', ['user_id']);
        await queryInterface.addIndex('lesson_comments', ['cohort_id']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('lesson_comments');
    }
};
