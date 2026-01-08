const { sequelize } = require("./models");

async function diagnose() {
    try {
        const [results] = await sequelize.query("SELECT name FROM SequelizeMeta ORDER BY name DESC LIMIT 15");
        results.forEach(r => console.log(r.name));
        process.exit(0);
    } catch (err) {
        console.error("Diagnosis failed:", err);
        process.exit(1);
    }
}

diagnose();
