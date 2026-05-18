import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import crypto from 'crypto';

export const data = new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Link your Roblox account to this Discord server.');

export async function execute(interaction, oauthStates) {
    if (!interaction.guildId) {
        return interaction.reply({ 
            content: 'Please run this command inside a server!', 
            flags: 'Ephemeral'
        });
    }

    const stateToken = crypto.randomUUID();

    oauthStates.set(stateToken, {
        discordId: interaction.user.id,
        guildId: interaction.guildId
    });

    setTimeout(() => oauthStates.delete(stateToken), 10 * 60 * 1000);

    const robloxAuthUrl = new URL('https://apis.roblox.com/oauth/v1/authorize');
    robloxAuthUrl.searchParams.append('client_id', process.env.ROBLOX_OAUTH_CLIENT_ID);
    robloxAuthUrl.searchParams.append('redirect_uri', process.env.ROBLOX_REDIRECT_URI);
    robloxAuthUrl.searchParams.append('scope', 'openid profile');
    robloxAuthUrl.searchParams.append('response_type', 'code');
    robloxAuthUrl.searchParams.append('state', stateToken);

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setLabel('Verify with Roblox')
            .setStyle(ButtonStyle.Link)
            .setURL(robloxAuthUrl.toString())
    );

    await interaction.reply({
        content: 'Click the button below to safely and securely link your Roblox account!',
        components: [row],
        flags: 'Ephemeral'
    });
}