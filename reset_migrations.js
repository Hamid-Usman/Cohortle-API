const { sequelize } = require("./models");

async function reset() {
    try {
        const list = [
            '20251219000005-restructure-communities.js',
            '20251219000006-enhance-programmes.js',
            '20251219000007-restructure-cohorts.js',
            '20251219000008-rename-modules-table.js',
            '20251220000000-add-community-members-and-join-code.js'
        ];

        for (const name of list) {
            console.log(`Removing ${name} from SequelizeMeta...`);
            await sequelize.query(`DELETE FROM SequelizeMeta WHERE name = '${name}'`);
        }

        console.log("Reset finished successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Reset failed:", err);
        process.exit(1);
    }
}

reset();
