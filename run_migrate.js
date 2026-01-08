const { exec } = require('child_process');

exec('npx sequelize-cli db:migrate', (error, stdout, stderr) => {
    console.log('STDOUT:', stdout);
    console.log('STDERR:', stderr);
    if (error) {
        console.log('ERROR:', error.message);
    }
    process.exit(error ? 1 : 0);
});
