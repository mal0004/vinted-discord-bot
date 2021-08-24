const config = require('./config.json');

const Database = require('easy-json-database');
const db = new Database('./db.json');
if (!db.has('subscriptions')) db.set('subscriptions', []);

const Discord = require('discord.js');
const client = new Discord.Client({
    intents: [Discord.Intents.FLAGS.GUILDS]
});

const synchronizeSlashCommands = require('discord-sync-commands');
synchronizeSlashCommands(client, [
    {
        name: 'abonner',
        description: 'Abonnez-vous à une URL de recherche',
        options: [
            {
                name: 'url',
                description: 'L\'URL de la recherche Vinted',
                type: 3,
                required: true
            },
            {
                name: 'channel',
                description: 'Le salon dans lequel vous souhaitez envoyer les notifications',
                type: 7,
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
                type: 3,
                required: true
            }
        ]
    },
    {
        name: 'abonnements',
        description: 'Accèdez à la liste de tous vos abonnements',
        options: []
    }
], true);

const vinted = require('vinted-api');

let lastFetchFinished = true;

const syncSubscription = (sub) => {
    return new Promise((resolve) => {
        vinted.search(sub.url, {
            newestFirst: true
        }).then((res) => {
            if (!res.items) {
                console.log('Search done bug got wrong response. Promise resolved.', res);
                resolve();
                return;
            }
            const lastItemSub = db.get(`last_item_${sub.id}`);
            const alreadySentItems = db.get(`sent_items_${sub.id}`);
            let items = res.items
                .map((item) => ({
                    ...item,
                    createdTimestamp: new Date(item.created_at_ts).getTime()
                }))
                .sort((a, b) => b.createdTimestamp - a.createdTimestamp)
                .filter((item) => 
                    item.createdTimestamp > lastItemSub
                    && !alreadySentItems.includes(item.id)
                );
            if (items.length > 0) {
                db.set(`last_item_${sub.id}`, items[0].createdTimestamp);
                items.sort((a, b) => b.createdTimestamp - a.createdTimestamp).forEach((item) => {
                    db.push(`sent_items_${sub.id}`, item.id);
                    const embed = new Discord.MessageEmbed()
                        .setTitle(item.title)
                        .setURL(`https://www.vinted.fr/${item.path}`)
                        .setImage(item.photos[0]?.url)
                        .setColor('#008000')
                        .setTimestamp(item.createdTimestamp)
                        .setFooter('Date Publication')
                        .addField('Taille', item.size || 'vide', true)
                        .addField('Prix', item.price || 'vide', true)
                        .addField('Condition', item.status || 'vide', true);
                    client.channels.cache.get(sub.channelID)?.send({ embeds: [embed]});
                });
            }
            console.log(`Search done (got ${res.items.length} items). Promise resolved.`);
            resolve();
        }).catch((e) => {
            console.error('Search returned an error. Promise resolved.', e);
            resolve();
        });
    });
};

const sync = () => {

    if (!lastFetchFinished) return;
    lastFetchFinished = false;

    console.log(`${new Date().toISOString()} | Sync is running...`);

    const subscriptions = db.get('subscriptions');

    const promises = subscriptions.map((sub) => syncSubscription(sub));
    Promise.all(promises).then(() => {
        lastFetchFinished = true;
    });

};

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);

    db.all().forEach((entry) => {
        if (entry.key.startsWith('last_item')) {
            const subID = entry.key.slice(10, entry.key.length);
            db.set(`last_item_${subID}`, Date.now());
        }
    })
    sync();
    setInterval(sync, 10000);
});

client.on('interactionCreate', (interaction) => {

    if (!interaction.isCommand()) return;
    if (!config.adminIDs.includes(interaction.user.id)) return void interaction.reply(`:x: Vous ne disposez pas des droits pour effectuer cette action !`);

    switch (interaction.commandName) {
        case 'abonner': {
            const sub = {
                id: Math.random().toString(36).substring(7),
                url: interaction.options.getString('url'),
                channelID: interaction.options.getChannel('channel').id
            }
            db.push('subscriptions', sub);
            db.set(`last_item_${sub.id}`, Date.now());
            db.set(`sent_items_${sub.id}`, []);
            interaction.reply(`:white_check_mark: Votre abonnement a été créé avec succès !\n**URL**: <${sub.url}>\n**Salon**: <#${sub.channelID}>`);
            break;
        }
        case 'désabonner': {
            const subID = interaction.options.getString('id');
            const subscriptions = db.get('subscriptions')
            const subscription = subscriptions.find((sub) => sub.id === subID);
            if (!subscription) {
                return void interaction.reply(':x: Aucun abonnement trouvé pour votre recherche...');
            }
            const newSubscriptions = subscriptions.filter((sub) => sub.id !== subID);
            db.set('subscriptions', newSubscriptions);
            interaction.reply(`:white_check_mark: Abonnement supprimé avec succès !\n**URL**: <${subscription.url}>\n**Salon**: <#${subscription.channelID}>`);
            break;
        }
        case 'abonnements': {
            const subscriptions = db.get('subscriptions');
            const chunks = [];
    
            subscriptions.forEach((sub) => {
                const content = `**ID**: ${sub.id}\n**URL**: ${sub.url}\n**Salon**: <#${sub.channelID}>\n`;
                const lastChunk = chunks.shift() || [];
                if ((lastChunk.join('\n').length + content.length) > 1024) {
                    if (lastChunk) chunks.push(lastChunk);
                    chunks.push([ content ]);
                } else {
                    lastChunk.push(content);
                    chunks.push(lastChunk);
                }
            });
    
            interaction.reply(`:white_check_mark: **${subscriptions.length}** abonnements sont actifs !`);
    
            chunks.forEach((chunk) => {
                const embed = new Discord.MessageEmbed()
                .setColor('RED')
                .setAuthor(`Utilisez la commande /désabonner pour supprimer un abonnement !`)
                .setDescription(chunk.join('\n'));
            
                interaction.channel.send({ embeds: [embed] });
            });
        }
    }
});

client.login(config.token);
