const { config } = require('dotenv');
config();

const { REST } = require('@discordjs/rest');
const { Routes, ApplicationCommandOptionType } = require('discord-api-types/v9');

const commands = [
    {
        name: 'abonner',
        description: 'Abonnez-vous à une URL de recherche',
        options: [
            {
                name: 'url',
                description: 'L\'URL de la recherche Vinted',
                type: ApplicationCommandOptionType.String,
                required: true
            },
            {
                name: 'channel',
                description: 'Le salon dans lequel vous souhaitez envoyer les notifications',
                type: ApplicationCommandOptionType.Channel,
                required: true
            }
        ]
    },
    {
        name: 'désabonner',
        description: 'Désabonnez-vous d\'une URL de recherche',
        options: [
            {
                name: 'id',
                description: 'L\'identifiant de l\'abonnement (/abonnements)',
                type: ApplicationCommandOptionType.String,
                required: true
            }
        ]
    },
    {
        name: 'abonnements',
        description: 'Accèdez à la liste de tous vos abonnements',
        options: []
    }
];

const rest = new REST({ version: '9' }).setToken(process.env.VINTED_BOT_TOKEN);

(async () => {
    try {

        const { data: { id: userId, username } } = await rest.get(
            Routes.user()
        );

        console.log(`👋 Connected as ${username}!`);

        const { data: [ { id: guildId, name: guildName } ] } = await rest.get(
            Routes.user().guilds()
        );

        console.log(`💻 Connected to ${guildName}!`);

        await rest.put(
            Routes.applicationGuildCommands(userId, guildId),
            { body: commands }
        ).then(console.log);

        console.log(`💻 Commands have been registered on ${guildName}!`);
    } catch (error) {
        console.error(error);
    }
})();