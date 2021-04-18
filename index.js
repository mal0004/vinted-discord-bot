const config = require('./config.json');

const Database = require('easy-json-database');
const db = new Database('./db.json');
if (!db.has('subscriptions')) db.set('subscriptions', []);

const Discord = require('discord.js');
const client = new Discord.Client();

const vinted = require('vinted-api');

const sync = () => {

    console.log(`${new Date().toISOString()} | Sync is running...`);

    const subscriptions = db.get('subscriptions');

    subscriptions.forEach((sub) => {
        vinted.search(sub.query, {
            order: 'newest_first'
        }).then((res) => {
            const lastItemSub = db.get(`last_item_${sub.id}`);
            const alreadySentItems = db.get(`sent_items_${sub.id}`);
            let items = res.items
                .map((item) => ({
                    ...item,
                    createdTimestamp: new Date(item.created_at_ts).getTime()
                }))
                .sort((a, b) => b.createdTimestamp - a.createdTimestamp)
                .filter((item) => 
                    (sub.maxPrice ? parseInt(item.price_numeric) < sub.maxPrice : true)
                    && (sub.size ? item.size === sub.size : true)
                    && (sub.color ? item.color1 === sub.color : true)
                    && item.createdTimestamp > (lastItemSub - 1000 * 60 * 5)
                    && !alreadySentItems.includes(item.id)
                );
            if (items.length > 0) {
                db.set(`last_item_${sub.id}`, items[0].createdTimestamp);
                items.sort((a, b) => b.createdTimestamp - a.createdTimestamp).forEach((item) => {
                    db.push(`sent_items_${sub.id}`, item.id);
                    const embed = new Discord.MessageEmbed()
                        .setTitle(item.title)
                        .setURL(`https://www.vinted.fr/${item.path}`)
                        .setImage(item.photos[0].url)
                        .setColor('#008000')
                        .setDescription('Date publication : ' + item.created_at)
                        .addField('Taille', item.size, true)
                        .addField('Prix', item.price, true)
                        .addField('Condition', item.status, true);
                    client.channels.cache.get(sub.channelID)?.send(embed);
                });
            }
        });
    });

};

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    sync();
    setInterval(sync, 10000);
});

client.on('message', (message) => {


    if (message.author.bot) return;
    if (message.channel.type !== 'text') return;
    if (!config.adminIDs.includes(message.author.id)) return;

    if (message.content.startsWith('!abonnement')) {

        const collector = new Discord.MessageCollector(message.channel, (m) => m.author.id === message.author.id);
        const subscription = {
            query: null,
            maxPrice: null,
            color: null,
            size: null,
            channelID: null
        };

        message.reply('bonjour, envoyez maintenant le nom de l\'article dont vous souhaitez recevoir les alertes.')

        collector.on('collect', (m) => {

            if (subscription.size && !subscription.channelID) {
                if (!m.mentions.channels.first()) {
                    m.reply(`veuillez mentionner un salon valide !`);
                } else {
                    subscription.channelID = m.mentions.channels.first().id;
                    m.reply(`tout est configuré ! Les notifications arriveront très bientôt :bell:`);
                    const subscriptionID = Math.random().toString(36).substring(7);
                    db.push(`subscriptions`, {
                        ...subscription,
                        id: subscriptionID
                    });
                    db.set(`last_item_${subscriptionID}`, Date.now());
                    db.set(`sent_items_${subscriptionID}`, []);
                }
            }

            if (subscription.color && !subscription.size) {
                const size = m.content === 'non' ? null : m.content;
                subscription.size = size;
                m.reply(`${!size ? 'aucune' : ''} taille enregistrée ! Maintenant, mentionnez le salon dans lequels seront envoyés les résultats !`);
            }

            if (subscription.maxPrice && !subscription.color) {
                const color = m.content === 'non' ? null : m.content;
                subscription.color = color;
                m.reply(`${!color ? 'aucune' : ''} couleur enregistrée ! Maintenant, envoyez la taille de l'article (telle qu'elle est affichée sur Vinted) ou "non".`);
            }

            if (subscription.query && !subscription.maxPrice) {
                let successText;
                if (m.content === "non") {
                    successText = 'aucun prix maximum défini !';
                } else {
                    const price = m.content.endsWith('€') ? parseInt(m.content.slice(0, m.content - 1)) : parseInt(m.content);
                    subscription.maxPrice = price;
                    successText = `prix maximum enregistré (${subscription.maxPrice} euros) ! `;
                }
                m.reply(`${successText} Maintenant, envoyez la couleur de l'article (telle qu'elle est affichée sur Vinted) ou "non".`);
            }

            if (!subscription.query) {
                subscription.query = m.content;
                m.reply(`recherche enregistrée ! Maintenant, envoyez le prix maximum de l'annonce (ou "non" pour ne définir aucun prix maximum).`);
            }

        });

    }

});

client.login(config.token);
