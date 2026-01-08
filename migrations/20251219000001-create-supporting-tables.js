'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Create programme_invites table
        await queryInterface.createTable('programme_invites', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false
            },
            programme_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'programmes',
                    key: 'id'
                },
                onDelete: 'CASCADE'
            },
            invite_code: {
                type: Sequelize.STRING(50),
                allowNull: false,
                unique: true
            },
            created_by: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onDelete: 'CASCADE'
            },
            max_uses: {
                type: Sequelize.INTEGER,
                allowNull: true
            },
            current_uses: {
                type: Sequelize.INTEGER,
                defaultValue: 0
            },
            expires_at: {
                type: Sequelize.DATE,
                allowNull: true
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });

        await queryInterface.addIndex('programme_invites', ['invite_code']);

        // Create lesson_content table
        await queryInterface.createTable('lesson_content', {
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
            content_type: {
                type: Sequelize.ENUM('pdf', 'video', 'link', 'text'),
                allowNull: false
            },
            content_url: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            content_text: {
                type: Sequelize.TEXT('long'),
                allowNull: true
            },
            order_number: {
                type: Sequelize.INTEGER,
                defaultValue: 0
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

        // Create lesson_schedule table
        await queryInterface.createTable('lesson_schedule', {
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
            cohort_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'cohorts',
                    key: 'id'
                },
                onDelete: 'CASCADE'
            },
            scheduled_date: {
                type: Sequelize.DATEONLY,
                allowNull: false
            },
            scheduled_time: {
                type: Sequelize.TIME,
                allowNull: true
            },
            duration_minutes: {
                type: Sequelize.INTEGER,
                allowNull: true
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

        await queryInterface.addConstraint('lesson_schedule', {
            fields: ['lesson_id', 'cohort_id', 'scheduled_date'],
            type: 'unique',
            name: 'unique_lesson_cohort_schedule'
        });

        // Create discussions table
        await queryInterface.createTable('discussions', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false
            },
            programme_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'programmes',
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
            lesson_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'module_lessons',
                    key: 'id'
                },
                onDelete: 'CASCADE'
            },
            title: {
                type: Sequelize.STRING(255),
                allowNull: false
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            created_by: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onDelete: 'CASCADE'
            },
            is_pinned: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
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

        // Create discussion_comments table
        await queryInterface.createTable('discussion_comments', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false
            },
            discussion_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'discussions',
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
            comment_text: {
                type: Sequelize.TEXT,
                allowNull: false
            },
            parent_comment_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'discussion_comments',
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

        // Create announcements table
        await queryInterface.createTable('announcements', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false
            },
            programme_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'programmes',
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
            title: {
                type: Sequelize.STRING(255),
                allowNull: false
            },
            content: {
                type: Sequelize.TEXT,
                allowNull: false
            },
            created_by: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onDelete: 'CASCADE'
            },
            priority: {
                type: Sequelize.ENUM('low', 'medium', 'high'),
                defaultValue: 'medium'
            },
            published_at: {
                type: Sequelize.DATE,
                allowNull: true
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

        // Create notifications table
        await queryInterface.createTable('notifications', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false
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
            type: {
                type: Sequelize.ENUM('announcement', 'discussion', 'lesson', 'progress', 'system'),
                allowNull: false
            },
            title: {
                type: Sequelize.STRING(255),
                allowNull: false
            },
            message: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            link: {
                type: Sequelize.STRING(500),
                allowNull: true
            },
            is_read: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            },
            sent_via_email: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });

        await queryInterface.addIndex('notifications', ['user_id', 'is_read'], {
            name: 'idx_user_unread'
        });

        // Create programme_progress table
        await queryInterface.createTable('programme_progress', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false
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
            programme_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'programmes',
                    key: 'id'
                },
                onDelete: 'CASCADE'
            },
            cohort_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'cohorts',
                    key: 'id'
                },
                onDelete: 'CASCADE'
            },
            total_lessons: {
                type: Sequelize.INTEGER,
                defaultValue: 0
            },
            completed_lessons: {
                type: Sequelize.INTEGER,
                defaultValue: 0
            },
            completion_percentage: {
                type: Sequelize.DECIMAL(5, 2),
                defaultValue: 0.00
            },
            last_activity_at: {
                type: Sequelize.DATE,
                allowNull: true
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

        await queryInterface.addConstraint('programme_progress', {
            fields: ['user_id', 'programme_id', 'cohort_id'],
            type: 'unique',
            name: 'unique_user_programme_cohort'
        });

        // Create activity_logs table
        await queryInterface.createTable('activity_logs', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false
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
            programme_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'programmes',
                    key: 'id'
                },
                onDelete: 'SET NULL'
            },
            cohort_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'cohorts',
                    key: 'id'
                },
                onDelete: 'SET NULL'
            },
            action_type: {
                type: Sequelize.ENUM('create', 'update', 'delete', 'enroll', 'complete', 'comment', 'announce'),
                allowNull: false
            },
            entity_type: {
                type: Sequelize.ENUM('community', 'programme', 'cohort', 'module', 'lesson', 'member', 'discussion', 'announcement'),
                allowNull: false
            },
            entity_id: {
                type: Sequelize.INTEGER,
                allowNull: true
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            metadata: {
                type: Sequelize.JSON,
                allowNull: true
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });

        await queryInterface.addIndex('activity_logs', ['user_id']);
        await queryInterface.addIndex('activity_logs', ['programme_id']);
        await queryInterface.addIndex('activity_logs', ['created_at']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('activity_logs');
        await queryInterface.dropTable('programme_progress');
        await queryInterface.dropTable('notifications');
        await queryInterface.dropTable('announcements');
        await queryInterface.dropTable('discussion_comments');
        await queryInterface.dropTable('discussions');
        await queryInterface.dropTable('lesson_schedule');
        await queryInterface.dropTable('lesson_content');
        await queryInterface.dropTable('programme_invites');
    }
};
