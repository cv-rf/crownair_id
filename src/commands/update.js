import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { dbQueries } from '../database/db.js';
import { syncUserRolesAndName } from '../utils/sync.js';

export const data = new SlashCommandBuilder()
    .setName('update')
    .setDescription('Update your server nickname and Roblox group roles, or update another user.')
    .addUserOption(option => 
        option.setName('target')
            .setDescription('The user to update (Staff Only)')
            .setRequired(false));

export async function execute(interaction) {
    const targetUser = interaction.options.getUser('target') || interaction.user;
    
    if (targetUser.id !== interaction.user.id && !interaction.member.permissions.has('ManageRoles')) {
        return interaction.reply({
            content: '❌ You do not have permission to update other server members.',
            flags: [MessageFlags.Ephemeral]
        });
    }

    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    const record = dbQueries.getUser(targetUser.id);
    if (!record) {
        return interaction.editReply({ 
            content: targetUser.id === interaction.user.id 
                ? '❌ You haven\'t verified your Roblox account yet. Use `/verify` to link your account.' 
                : `❌ **${targetUser.tag}** hasn't verified their Roblox account with this bot yet.`
        });
    }

    try {
        const member = await interaction.guild.members.fetch(targetUser.id);
        
        const result = await syncUserRolesAndName(member, record);

        if (!result.success) {
            throw new Error(result.error);
        }

        const addedRolesString = result.added?.length > 0
            ? result.added.map(id => `<@&${id}>`).join(', ')
            : 'None';
        
        const removedRolesString = result.removed?.length > 0
            ? result.removed.map(id => `<@&${id}>`).join(', ')
            : 'None';

        const successEmbed = new EmbedBuilder()
            .setColor('#00AAFF')
            .setTitle('Profile Synchronized')
            .setDescription(`Successfully refreshed identity state for **${record.roblox_username}**.`)
            .addFields(
                { name: 'Discord Account', value: `${targetUser}`, inline: true },
                { name: 'Roblox Identity', value: `[${record.roblox_username}](https://www.roblox.com/users/${record.roblox_id}/profile)`, inline: true },
                { name: 'Roles Added', value: addedRolesString, inline: false },
                { name: 'Roles Removed', value: removedRolesString, inline: false }
            )
            .setTimestamp();

        return interaction.editReply({ embeds: [successEmbed] });

    } catch (error) {
        console.error(`[Update Command] Error updating user ${targetUser.id}:`, error);
        return interaction.editReply({
            content: `An error occurred while syncing: \`${error.message}\`. Make sure the bot's role is placed **above** the group roles in your server settings!`
        });
    }
}