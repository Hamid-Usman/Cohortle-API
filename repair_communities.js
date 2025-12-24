const path = require('path');
const { sequelize } = require(path.join(process.cwd(), "models", "index.js"));

async function repair() {
    try {
        const [columns] = await sequelize.query("DESCRIBE communities");
        const fields = columns.map(c => c.Field);

        console.log("Current fields:", fields);

        // 1. Rename community_owner to owner_id
        if (fields.includes("community_owner") && !fields.includes("owner_id")) {
            console.log("Renaming community_owner to owner_id...");
            await sequelize.query("ALTER TABLE communities CHANGE community_owner owner_id INT");
        }

        // 2. Add organization_type
        if (!fields.includes("organization_type")) {
            console.log("Adding organization_type...");
            await sequelize.query("ALTER TABLE communities ADD COLUMN organization_type VARCHAR(100) AFTER name");
        }

        // 3. Remove cohort_id
        if (fields.includes("cohort_id")) {
            console.log("Removing cohort_id...");
            // Drop FK first if exists
            try {
                const [fks] = await sequelize.query(`
          SELECT CONSTRAINT_NAME 
          FROM information_schema.KEY_COLUMN_USAGE 
          WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'communities' 
          AND COLUMN_NAME = 'cohort_id'
        `);
                for (const fk of fks) {
                    if (fk.CONSTRAINT_NAME !== 'PRIMARY') {
                        await sequelize.query(\`ALTER TABLE communities DROP FOREIGN KEY \${fk.CONSTRAINT_NAME}\`).catch(e => console.log("Skip FK drop:", e.message));
          }
        }
      } catch (e) {}
      await sequelize.query("ALTER TABLE communities DROP COLUMN cohort_id");
    }

    // 4. Remove type
    if (fields.includes("type")) {
      console.log("Removing type...");
      await sequelize.query("ALTER TABLE communities DROP COLUMN type");
    }

    // 5. Add fk_communities_owner
    try {
      const [fks] = await sequelize.query(`
        SELECT CONSTRAINT_NAME 
        FROM information_schema.KEY_COLUMN_USAGE 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'communities' 
        AND CONSTRAINT_NAME = 'fk_communities_owner'
                            `);
      if (fks.length === 0) {
        console.log("Adding fk_communities_owner...");
        await sequelize.query("ALTER TABLE communities ADD CONSTRAINT fk_communities_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE");
      }
    } catch (e) {
        console.error("Failed to add FK:", e.message);
    }

    console.log("Repair finished successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Repair failed:", err);
    process.exit(1);
  }
}

repair();
