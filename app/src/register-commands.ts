import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { ApplicationCommandOptionType } from 'discord-api-types/v10';

const commands = [
    {
        name: 'abonner',
        description: "Abonnez-vous à une URL de recherche Vinted",
        options: [
            {
                name: 'url',
                description: "L'URL de la recherche Vinted",
                type: ApplicationCommandOptionType.String,
                required: true,
            },
            {
                name: 'channel',
                description: 'Le salon dans lequel recevoir les notifications',
                type: ApplicationCommandOptionType.Channel,
                required: true,
            },
        ],
    },
    {
        name: 'désabonner',
        description: "Désabonnez-vous d'une URL de recherche",
        options: [
            {
                name: 'id',
                description: "L'identifiant de l'abonnement (voir /abonnements)",
                type: ApplicationCommandOptionType.String,
                required: true,
            },
        ],
    },
    {
        name: 'abonnements',
        description: 'Affichez la liste de tous vos abonnements actifs',
        options: [],
    },
];

const token = process.env.VINTED_BOT_TOKEN;
if (!token) {
    console.error('❌ La variable VINTED_BOT_TOKEN est manquante.');
    process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
    try {
        const { id: appId } = (await rest.get(Routes.user())) as { id: string };
        await rest.put(Routes.applicationCommands(appId), { body: commands });
        console.log('✅ Commandes slash enregistrées globalement !');
    } catch (e) {
        console.error("❌ Erreur lors de l'enregistrement des commandes :", e);
        process.exit(1);
    }
})();
