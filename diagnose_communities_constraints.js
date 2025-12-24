const { sequelize } = require("./models");

async function diagnose() {
    try {
        const [results] = await sequelize.query(`
      SELECT CONSTRAINT_NAME 
      FROM information_schema.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'communities'
    `);
        console.log("JSON_START" + JSON.stringify(results.map(r => r.CONSTRAINT_NAME)) + "JSON_END");
        process.exit(0);
    } catch (err) {
        console.error("Diagnosis failed:", err);
        process.exit(1);
    }
}

diagnose();
