const exec = require('child_process').exec;
const bots = require('./bots.json');

console.log(`🐳 Checking existing volumes...`);

exec(`docker volume ls -q`, (err, stdout, stderr) => {

    const volumes = stdout.split('\n');

    bots.forEach((bot) => {
        console.log(`🐋 Starting ${bot.name}...`);

        const start = () => {
            exec(`VINTED_BOT_ADMIN_IDS=${bot.adminIDs} VINTED_BOT_TOKEN=${bot.token} docker-compose -f docker-compose.yaml -p bot-${bot.name} -d up`);
        }
        
        if (volumes.includes(bot.name)) {
            console.log(`📦 ${bot.name} database has been recovered!`);
            start();
        } else {
            exec(`docker volume create bot-${bot.name}`, (err, stdout, stderr) => {
                if (!err) {
                    console.log(`📦 ${bot.name} database has been created!`);
                    start();
                } else console.error(err);
            });
        }
        
    });

});
