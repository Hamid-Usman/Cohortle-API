const { sequelize } = require("./models");

async function diagnose() {
    try {
        const [columns] = await sequelize.query("DESCRIBE communities");
        const fieldNames = columns.map(c => c.Field);
        console.log("JSON_START" + JSON.stringify(fieldNames) + "JSON_END");
        process.exit(0);
    } catch (err) {
        console.error("Diagnosis failed:", err);
        process.exit(1);
    }
}

diagnose();
