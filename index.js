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
        name: 'subscribe',
        description: 'Subscribe to a search URL',
        options: [
            {
                name: 'url',
                description: 'The URL to subscribe to',
                type: 3
            },
            {
                name: 'channel',
                description: 'The channel to send the results to',
                type: 7
            }
        ]
    },
    {
        name: 'unsubscribe',
        description: 'Unsubscribe from a search URL',
        options: [
            {
                name: 'id',
                description: 'The ID of the subscription to unsubscribe from',
                type: 4
            }
        ]
    },
    {
        name: 'subscriptions',
        description: 'List all your subscriptions',
        options: []
    }
], true);

const vinted = require('vinted-api');

let lastFetchFinished = true;

const syncSubscription = (sub) => {
    return new Promise((resolve) => {
        vinted.search(sub.url).then((res) => {
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
                    client.channels.cache.get(sub.channelID)?.send(embed);
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

    switch (interaction.commandName) {
        case 'subscribe': {
            const sub = {
                id: Math.random().toString(36).substring(7),
                url: interaction.options.getString('url'),
                channelID: interaction.options.getChannel('channel').id
            }
            db.push('subscriptions', sub);
            interaction.reply('abonnement créé !');
            break;
        }
        case 'unsubscribe': {
            const subID = interaction.options.getInteger('id');
            const abonnements = db.get('subscriptions')
            const newAbonnements = abonnements.filter((abo) => abo.id !== subID);
            if (abonnements.length === abonnements.length) {
                return void interaction.reply('aucun abonnement pour cet ID!');
            }
            db.set('subscriptions', newAbonnements);
            interaction.reply('abonnement supprimé!');
            break;
        }
        case 'subscriptions': {
            const abonnements = db.get('subscriptions');
            const chunks = [];
    
            abonnements.forEach((abo) => {
                const content = `${abo.url} | ${abo.id} | <#${abo.channelID}>`;
                const lastChunk = chunks.shift() || [];
                if ((lastChunk.join('\n').length + content.length) > 1024) {
                    if (lastChunk) chunks.push(lastChunk);
                    chunks.push([ content ]);
                } else {
                    lastChunk.push(content);
                    chunks.push(lastChunk);
                }
            });
    
            interaction.reply('voilà la liste de vos abonnements.');
    
            chunks.forEach((chunk) => {
                const embed = new Discord.MessageEmbed()
                .setColor('RED')
                .setAuthor(`Tapez !unsubscribe pour supprimer un abonnement`)
                .setDescription(chunk.join('\n'));
            
                interaction.channel.send(embed);
            });
        }
    }
});

client.login(config.token);
