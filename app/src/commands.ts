import { EmbedBuilder, Interaction, TextChannel } from 'discord.js';
import { AppDataSource } from './database';
import { Subscription } from './entities/Subscription';

const adminIDs = (process.env.VINTED_BOT_ADMIN_IDS ?? '').split(',').filter(Boolean);

export async function handleInteraction(interaction: Interaction): Promise<void> {
    if (!interaction.isChatInputCommand()) return;

    if (!adminIDs.includes(interaction.user.id)) {
        await interaction.reply(':x: Vous ne disposez pas des droits pour effectuer cette action !');
        return;
    }

    const repo = AppDataSource.getRepository(Subscription);

    switch (interaction.commandName) {
        case 'abonner': {
            const sub: Partial<Subscription> = {
                url: interaction.options.getString('url', true),
                channelId: interaction.options.getChannel('channel', true).id,
                createdAt: new Date(),
                isActive: true,
            };
            await repo.save(sub);
            await interaction.reply(
                `:white_check_mark: Votre abonnement a été créé avec succès !\n**URL**: <${sub.url}>\n**Salon**: <#${sub.channelId}>`
            );
            break;
        }

        case 'désabonner': {
            const subID = interaction.options.getString('id', true);
            const subscription = await repo.findOne({
                where: { isActive: true, id: parseInt(subID, 10) },
            });
            if (!subscription) {
                await interaction.reply(':x: Aucun abonnement trouvé pour votre recherche...');
                return;
            }
            await repo.update({ id: subscription.id }, { isActive: false });
            await interaction.reply(
                `:white_check_mark: Abonnement supprimé avec succès !\n**URL**: <${subscription.url}>\n**Salon**: <#${subscription.channelId}>`
            );
            break;
        }

        case 'abonnements': {
            const subscriptions = await repo.find({ where: { isActive: true } });
            await interaction.reply(
                `:white_check_mark: **${subscriptions.length}** abonnements sont actifs !`
            );

            const chunks: string[][] = [[]];
            for (const sub of subscriptions) {
                const content = `**ID**: ${sub.id}\n**URL**: ${sub.url}\n**Salon**: <#${sub.channelId}>\n`;
                const lastChunk = chunks[chunks.length - 1];
                if (lastChunk.join('\n').length + content.length > 1024) {
                    chunks.push([content]);
                } else {
                    lastChunk.push(content);
                }
            }

            for (const chunk of chunks) {
                if (!chunk.length) continue;
                const embed = new EmbedBuilder()
                    .setColor('Red')
                    .setAuthor({
                        name: 'Utilisez la commande /désabonner pour supprimer un abonnement !',
                    })
                    .setDescription(chunk.join('\n'));
                await (interaction.channel as TextChannel).send({ embeds: [embed] });
            }
            break;
        }
    }
}
