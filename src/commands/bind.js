import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } from 'discord.js';
import { dbQueries } from '../database/db.js';

export const data = new SlashCommandBuilder()
    .setName('bind')
    .setDescription('Manage modular Roblox group role bindings.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand(subcommand =>
        subcommand
            .setName('add')
            .setDescription('Link a Roblox group rank to a Discord role.')
            .addStringOption(opt => opt.setName('group_id').setDescription('The Roblox Group ID').setRequired(true))
            .addIntegerOption(opt => opt.setName('roblox_rank').setDescription('The numeric rank value (0-255)').setRequired(true))
            .addRoleOption(opt => opt.setName('discord_role').setDescription('The target Discord role to assign').setRequired(true))
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('remove')
            .setDescription('Unlink a Roblox group rank from a Discord role.')
            .addStringOption(opt => opt.setName('group_id').setDescription('The Roblox Group ID').setRequired(true))
            .addIntegerOption(opt => opt.setName('roblox_rank').setDescription('The numeric rank value (0-255)').setRequired(true))
    );

export async function execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const groupId = interaction.options.getString('group_id');
    const rank = interaction.options.getInteger('roblox_rank');

    if (rank < 0 || rank > 255) {
        return interaction.reply({
            content: 'Roblox rank numbers must be between 0 and 255.',
            flags: [MessageFlags.Ephemeral]
        });
    }

    if (subcommand === 'add') {
        const role = interaction.options.getRole('discord_role');

        const existing = dbQueries.getBind(groupId, rank);
        if (existing) {
            return interaction.reply({
                content: `A binding already exists for Group \`${groupId}\`, Rank \`${rank}\` (Linked to <@&${existing.discord_role_id}>). Remove it first.`,
                flags: [MessageFlags.Ephemeral]
            });
        }

        dbQueries.addBind(groupId, rank, role.name, role.id);

        const embed = new EmbedBuilder()
            .setColor('#00FF7F')
            .setTitle('Role Binding Added')
            .setDescription(`Successfully created a dynamic connection between Roblox and Discord.`)
            .addFields(
                { name: 'Roblox Group ID', value: `\`${groupId}\``, inline: true },
                { name: 'Roblox Rank', value: `\`${rank}\``, inline: true },
                { name: 'Discord Role', value: `${role}`, inline: true }
            );

        return interaction.reply({ embeds: [embed] });
    }

    if (subcommand === 'remove') {
        const existing = dbQueries.getBind(groupId, rank);
        if (!existing) {
            return interaction.reply({
                content: `No binding found for Group \`${groupId}\` at Rank \`${rank}\`.`,
                flags: [MessageFlags.Ephemeral]
            });
        }

        // Delete from SQLite
        dbQueries.removeBind(groupId, rank);

        const embed = new EmbedBuilder()
            .setColor('#FF4500')
            .setTitle('Role Binding Removed')
            .setDescription(`Deleted connection for Group \`${groupId}\` at Rank \`${rank}\`. Users matching this rank will no longer receive or update roles from it.`);

        return interaction.reply({ embeds: [embed] });
    }
}