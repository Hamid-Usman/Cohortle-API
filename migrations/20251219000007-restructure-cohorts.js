'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Step 1: Drop old foreign key for cohort_owner if it exists
        const [ownerForeignKeys] = await queryInterface.sequelize.query(
            `SELECT CONSTRAINT_NAME 
       FROM information_schema.KEY_COLUMN_USAGE 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'cohorts' 
       AND COLUMN_NAME = 'cohort_owner'
       AND REFERENCED_TABLE_NAME IS NOT NULL`
        );

        if (ownerForeignKeys.length > 0) {
            try {
                await queryInterface.removeConstraint('cohorts', ownerForeignKeys[0].CONSTRAINT_NAME);
            } catch (e) { }
        }

        // Step 2: Remove old columns that are no longer needed
        const columnsToRemove = [
            'cohort_owner',
            'url',
            'description',
            'goal',
            'revenue',
            'referral',
            'community_structure',
            'allow_public_join'
        ];

        for (const column of columnsToRemove) {
            try {
                await queryInterface.removeColumn('cohorts', column);
            } catch (error) {
                // Column might not exist, continue
            }
        }

        // Step 3: Add programme_id column if it doesn't exist
        const [progIdCols] = await queryInterface.sequelize.query(
            `SHOW COLUMNS FROM cohorts LIKE 'programme_id'`
        );
        if (progIdCols.length === 0) {
            await queryInterface.addColumn('cohorts', 'programme_id', {
                type: Sequelize.INTEGER,
                allowNull: false,
                after: 'id',
                defaultValue: 1 // Temporary default for existing records
            });
        }

        // Step 4: Add start_date and end_date if they don't exist
        const [startDateCols] = await queryInterface.sequelize.query(
            `SHOW COLUMNS FROM cohorts LIKE 'start_date'`
        );
        if (startDateCols.length === 0) {
            await queryInterface.addColumn('cohorts', 'start_date', {
                type: Sequelize.DATEONLY,
                allowNull: true,
                after: 'name'
            });
        }

        const [endDateCols] = await queryInterface.sequelize.query(
            `SHOW COLUMNS FROM cohorts LIKE 'end_date'`
        );
        if (endDateCols.length === 0) {
            await queryInterface.addColumn('cohorts', 'end_date', {
                type: Sequelize.DATEONLY,
                allowNull: true,
                after: 'start_date'
            });
        }

        // Step 5: Add max_members column if it doesn't exist
        const [maxMemCols] = await queryInterface.sequelize.query(
            `SHOW COLUMNS FROM cohorts LIKE 'max_members'`
        );
        if (maxMemCols.length === 0) {
            await queryInterface.addColumn('cohorts', 'max_members', {
                type: Sequelize.INTEGER,
                allowNull: true,
                after: 'status'
            });
        }

        // Step 6: Add foreign key for programme_id
        try {
            await queryInterface.addConstraint('cohorts', {
                fields: ['programme_id'],
                type: 'foreign key',
                name: 'fk_cohorts_programme',
                references: {
                    table: 'programmes',
                    field: 'id'
                },
                onDelete: 'CASCADE'
            });
        } catch (e) { }
    },

    async down(queryInterface, Sequelize) {
        try {
            await queryInterface.removeConstraint('cohorts', 'fk_cohorts_programme');
        } catch (e) { }

        try {
            await queryInterface.removeColumn('cohorts', 'max_members');
        } catch (e) { }

        try {
            await queryInterface.removeColumn('cohorts', 'end_date');
        } catch (e) { }

        try {
            await queryInterface.removeColumn('cohorts', 'start_date');
        } catch (e) { }

        try {
            await queryInterface.removeColumn('cohorts', 'programme_id');
        } catch (e) { }

        // Re-add old columns if they don't exist
        try {
            await queryInterface.addColumn('cohorts', 'cohort_owner', {
                type: Sequelize.INTEGER,
                allowNull: false
            });
        } catch (e) { }

        try {
            await queryInterface.addColumn('cohorts', 'url', {
                type: Sequelize.STRING(255)
            });
        } catch (e) { }

        try {
            await queryInterface.addColumn('cohorts', 'description', {
                type: Sequelize.TEXT
            });
        } catch (e) { }
    }
};
