import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { dbQueries } from '../database/db.js';

export const data = new SlashCommandBuilder()
    .setName('whois')
    .setDescription('Look up a server member\'s linked Roblox account or vice versa.')
    .addUserOption(option => 
        option.setName('user')
            .setDescription('The Discord user to look up')
            .setRequired(false))
    .addStringOption(option => 
        option.setName('roblox_username')
            .setDescription('The Roblox username to look up')
            .setRequired(false));

export async function execute(interaction) {
    const targetUser = interaction.options.getUser('user');
    const targetRobloxName = interaction.options.getString('roblox_username');

    if (!targetUser && !targetRobloxName) {
        const record = dbQueries.getUser(interaction.user.id);
        return replyWithProfile(interaction, interaction.user, record);
    }

    if (targetUser) {
        const record = dbQueries.getUser(targetUser.id);
        return replyWithProfile(interaction, targetUser, record);
    }

    if (targetRobloxName) {
        const record = dbQueries.getUserByRobloxName(targetRobloxName);

        if (!record) {
            return interaction.reply({ 
                content: `Could not find a verified Discord account linked to the Roblox user **${targetRobloxName}**`, 
                ephemeral: true 
            });
        }

        try {
            const discordUser = await interaction.client.users.fetch(record.discord_id);
            return replyWithProfile(interaction, discordUser, record);
        } catch (error) {
            return interaction.reply({
                content: `Found data: Roblox user **${record.roblox_username}** belongs to Discord ID \`${record.discord_id}\`, but I couldn't fetch their Discord profile.`,
                ephemeral: true
            });
        }
    }
}

function replyWithProfile(interaction, discordUser, dbRecord) {
    if (!dbRecord) {
        return interaction.reply({ 
            content: `**${discordUser.tag}** hasn't verified their Roblox account with this bot yet.`, 
            ephemeral: true 
        });
    }

    const profileEmbed = new EmbedBuilder()
        .setColor('#00AAFF')
        .setTitle(`Account Link Profile`)
        .setThumbnail(discordUser.displayAvatarURL())
        .addFields(
            { name: 'Discord Account', value: `${discordUser} (\`${discordUser.id}\`)`, inline: false },
            { name: 'Roblox Username', value: `[${dbRecord.roblox_username}](https://www.roblox.com/users/${dbRecord.roblox_id}/profile)`, inline: true },
            { name: 'Roblox ID', value: `\`${dbRecord.roblox_id}\``, inline: true }
        )
        .setTimestamp();

    return interaction.reply({ embeds: [profileEmbed] });
}