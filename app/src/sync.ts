import vinted from 'vinted-api';
import {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    TextChannel,
} from 'discord.js';
import { client } from './client';
import { AppDataSource } from './database';
import { Subscription } from './entities/Subscription';

let isFirstSync = true;
let isSyncing = false;

async function syncSubscription(sub: Subscription): Promise<void> {
    try {
        const res = await vinted.search(sub.url, false, false, { per_page: '20' });

        if (!res?.items) {
            console.log(`⚠️  Réponse inattendue pour l'abonnement ${sub.id}.`, res);
            return;
        }

        const lastItemTimestamp = sub.latestItemDate?.getTime() ?? null;

        const items = res.items
            .sort(
                (a, b) =>
                    new Date(b.photo.high_resolution.timestamp).getTime() -
                    new Date(a.photo.high_resolution.timestamp).getTime()
            )
            .filter(
                (item) =>
                    !lastItemTimestamp ||
                    new Date(item.photo.high_resolution.timestamp).getTime() > lastItemTimestamp
            );

        if (!items.length) return;

        const newLastItemDate = new Date(items[0].photo.high_resolution.timestamp);
        if (!lastItemTimestamp || newLastItemDate.getTime() > lastItemTimestamp) {
            await AppDataSource.getRepository(Subscription).update(
                { id: sub.id },
                { latestItemDate: newLastItemDate }
            );
        }

        const itemsToSend =
            lastItemTimestamp && !isFirstSync ? [...items].reverse() : [items[0]];

        const channel = client.channels.cache.get(sub.channelId) as TextChannel | undefined;
        if (!channel) {
            console.warn(
                `⚠️  Salon ${sub.channelId} introuvable pour l'abonnement ${sub.id}.`
            );
            return;
        }

        for (const item of itemsToSend) {
            const embed = new EmbedBuilder()
                .setTitle(item.title)
                .setURL(item.url)
                .setImage(item.photo.url)
                .setColor(0x09b1ba)
                .setTimestamp(new Date(item.photo.high_resolution.timestamp))
                .setFooter({ text: `Article lié à la recherche : ${sub.id}` })
                .addFields(
                    { name: 'Prix', value: String(item.price) || 'vide', inline: true },
                    { name: 'Taille', value: item.size_title || 'vide', inline: true }
                );

            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                    .setLabel('Détails')
                    .setURL(item.url)
                    .setEmoji('🔎')
                    .setStyle(ButtonStyle.Link),
                new ButtonBuilder()
                    .setLabel('Acheter')
                    .setURL(
                        `https://www.vinted.fr/transaction/buy/new?source_screen=item&transaction%5Bitem_id%5D=${item.id}`
                    )
                    .setEmoji('💸')
                    .setStyle(ButtonStyle.Link)
            );

            await channel.send({ embeds: [embed], components: [row] });
        }

        if (itemsToSend.length > 0) {
            const label =
                itemsToSend.length > 1 ? 'nouveaux articles trouvés' : 'nouvel article trouvé';
            console.log(`👕 ${itemsToSend.length} ${label} pour la recherche ${sub.id} !`);
        }
    } catch (e) {
        console.error(`❌ Erreur lors de la synchronisation de l'abonnement ${sub.id} :`, e);
    }
}

export async function sync(): Promise<void> {
    if (isSyncing) return;
    isSyncing = true;

    console.log('🤖 Synchronisation avec Vinted...');

    try {
        const subscriptions = await AppDataSource.getRepository(Subscription).find({
            where: { isActive: true },
        });
        await Promise.all(subscriptions.map(syncSubscription));
    } catch (e) {
        console.error('❌ Erreur lors de la synchronisation :', e);
    } finally {
        isFirstSync = false;
        isSyncing = false;
    }
}
