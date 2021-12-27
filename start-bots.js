const exec = require('child_process').exec;
const bots = require('./bots.json');

const recreate = () => {

    console.log(`🐳 Checking existing volumes...`);

    exec(`docker volume ls -q`, (err, stdout, stderr) => {

        const volumes = stdout.split('\n');

        bots.forEach((bot) => {
            console.log(`🐋 Starting ${bot.name}...`);

            const start = () => {
                exec(`BOT=${bot.name} VINTED_BOT_ADMIN_IDS=${bot.adminIDs} VINTED_BOT_TOKEN=${bot.token} docker-compose -f docker-compose.yaml -p bot-${bot.name} up -d`, (err, stdout, stderr) => {
                    if (err) {
                        console.error(`🐋 ${bot.name} failed to start.`);
                        console.error(err);
                        return;
                    }
                    console.log(stderr);
                });
            }
            
            if (volumes.includes(`bot-${bot.name}`)) {
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

};

const restart = process.argv.includes('-restart');

if (restart) {
    console.log('👋 Shutting down all bots...');
    bots.forEach((bot) => {
        exec(`docker-compose -p bot-${bot.name} stop`, (err, stdout, stderr) => {
            if (!err) {
                exec(`docker-compose -p bot-${bot.name} rm -f`, (err, stdout, stderr) => {
                    if (!err) {
                        console.log(`👋 Bot ${bot.name} has been shut down and removed.`);
                    } else {
                        console.log(`👎 Failed to remove containers for bot ${bot.name}`);
                    }
                });
            }
        });
    });
} else {
    recreate();
}
