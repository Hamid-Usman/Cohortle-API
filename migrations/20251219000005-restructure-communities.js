'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Step 1: Drop foreign key constraint from communities to cohorts
        const [foreignKeys] = await queryInterface.sequelize.query(
            `SELECT CONSTRAINT_NAME 
       FROM information_schema.KEY_COLUMN_USAGE 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'communities' 
       AND COLUMN_NAME = 'cohort_id'
       AND REFERENCED_TABLE_NAME IS NOT NULL`
        );

        if (foreignKeys.length > 0) {
            await queryInterface.removeConstraint('communities', foreignKeys[0].CONSTRAINT_NAME);
        }

        // Step 2: Remove cohort_id column from communities if it exists
        const [cohortIdCols] = await queryInterface.sequelize.query(
            `SHOW COLUMNS FROM communities LIKE 'cohort_id'`
        );
        if (cohortIdCols.length > 0) {
            await queryInterface.removeColumn('communities', 'cohort_id');
        }

        // Step 3: Remove type column if it exists
        const [typeCols] = await queryInterface.sequelize.query(
            `SHOW COLUMNS FROM communities LIKE 'type'`
        );
        if (typeCols.length > 0) {
            await queryInterface.removeColumn('communities', 'type');
        }

        // Step 4: Rename community_owner to owner_id if community_owner exists
        const [ownerCols] = await queryInterface.sequelize.query(
            `SHOW COLUMNS FROM communities LIKE 'community_owner'`
        );
        if (ownerCols.length > 0) {
            await queryInterface.renameColumn('communities', 'community_owner', 'owner_id');
        }

        // Step 5: Add organization_type column if it doesn't exist
        const [orgTypeCols] = await queryInterface.sequelize.query(
            `SHOW COLUMNS FROM communities LIKE 'organization_type'`
        );
        if (orgTypeCols.length === 0) {
            await queryInterface.addColumn('communities', 'organization_type', {
                type: Sequelize.STRING(100),
                allowNull: true,
                after: 'name'
            });
        }

        // Step 6: Add foreign key for owner_id or community_owner (whichever exists)
        // Check for current column name
        const [currentOwnerCols] = await queryInterface.sequelize.query(
            `SHOW COLUMNS FROM communities WHERE Field IN ('owner_id', 'community_owner')`
        );

        if (currentOwnerCols.length > 0) {
            const ownerColName = currentOwnerCols[0].Field;
            try {
                await queryInterface.addConstraint('communities', {
                    fields: [ownerColName],
                    type: 'foreign key',
                    name: 'fk_communities_owner',
                    references: {
                        table: 'users',
                        field: 'id'
                    },
                    onDelete: 'CASCADE'
                });
            } catch (error) {
                // Constraint might already exist
            }
        }
    },

    async down(queryInterface, Sequelize) {
        // Step 1: Remove fk
        try {
            await queryInterface.removeConstraint('communities', 'fk_communities_owner');
        } catch (error) { }

        // Step 2: Remove organization_type
        const [orgTypeCols] = await queryInterface.sequelize.query(
            `SHOW COLUMNS FROM communities LIKE 'organization_type'`
        );
        if (orgTypeCols.length > 0) {
            await queryInterface.removeColumn('communities', 'organization_type');
        }

        // Step 3: Rename owner_id back to community_owner
        const [ownerCols] = await queryInterface.sequelize.query(
            `SHOW COLUMNS FROM communities LIKE 'owner_id'`
        );
        if (ownerCols.length > 0) {
            await queryInterface.renameColumn('communities', 'owner_id', 'community_owner');
        }

        // Step 4: Add type back
        const [typeCols] = await queryInterface.sequelize.query(
            `SHOW COLUMNS FROM communities LIKE 'type'`
        );
        if (typeCols.length === 0) {
            await queryInterface.addColumn('communities', 'type', {
                type: Sequelize.STRING(255),
                allowNull: false,
                defaultValue: 'course'
            });
        }

        // Step 5: Add cohort_id back
        const [cohortIdCols] = await queryInterface.sequelize.query(
            `SHOW COLUMNS FROM communities LIKE 'cohort_id'`
        );
        if (cohortIdCols.length === 0) {
            await queryInterface.addColumn('communities', 'cohort_id', {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'cohorts',
                    key: 'id'
                }
            });
        }
    }
};
