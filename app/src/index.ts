import 'dotenv/config';
import 'reflect-metadata';
import { client } from './client';
import { initializeDatabase } from './database';
import { sync } from './sync';
import { handleInteraction } from './commands';

client.once('ready', () => {
    console.log(`🔗 Connecté sur le compte de ${client.user!.tag} !`);
    client.user!.setActivity('Vinted BOT | v4');

    const messages = [
        `🕊️ Ce projet libre et gratuit demande du temps. Si vous en avez les moyens, n'hésitez pas à soutenir le développement avec un don ! https://paypal.me/andr0z\n`,
        `🤟 Le saviez-vous ? Nous proposons notre propre version du bot en ligne 24/24 7/7 sans que vous n'ayez besoin de vous soucier de quoi que ce soit ! https://distrobot.fr\n`,
    ];
    let idx = 0;
    setTimeout(() => console.log(messages[0]), 3000);
    setInterval(() => {
        idx++;
        console.log(messages[idx % 2]);
    }, 120_000);

    sync();
    setInterval(sync, 15_000);
});

client.on('interactionCreate', handleInteraction);

async function main(): Promise<void> {
    await initializeDatabase();
    await client.login(process.env.VINTED_BOT_TOKEN);
}

main().catch((err) => {
    console.error('❌ Erreur fatale :', err);
    process.exit(1);
});
