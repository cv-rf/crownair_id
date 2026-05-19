import { Client, GatewayIntentBits, REST, Routes, Collection, MessageFlags } from 'discord.js';
import express from 'express';
import crypto from 'crypto';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
// import { dbQueries } from './database/db.js';
import { dbQueries } from "./database/index.js";
import { fetchGroupRoleset } from './utils/roblox.js';
import { syncUserRolesAndName } from './utils/sync.js';

import * as verifyCommand from './commands/verify.js';
import * as whoisCommand from './commands/whois.js';
import * as bindCommand from './commands/bind.js';
import * as updateCommand from './commands/update.js';

import certificationRoutes from './routes/certifications.js';

const app = express();

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.static('public'));
app.use(cookieParser());

app.use('/api/certifications', certificationRoutes);

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.GuildMembers
    ] 
});

const oauthStates = new Map();
const webOAuthStates = new Set();

client.commands = new Collection();
client.commands.set(verifyCommand.data.name, verifyCommand);
client.commands.set(whoisCommand.data.name, whoisCommand);
client.commands.set(bindCommand.data.name, bindCommand);
client.commands.set(updateCommand.data.name, updateCommand);

client.once('clientReady', async () => {
    console.log(`Bot logged in as ${client.user.tag}`);

    const commandsData = Array.from(client.commands.values()).map(command => command.data.toJSON());

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);
    try {
        await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID), { body: commandsData });
        console.log('Successfully registered global slash commands.');
    } catch (error) {
        console.error(error);
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction, oauthStates);
    } catch (error) {
        console.error(error);
        await interaction.reply({
            content: 'There was an error executing this command!',
            flags: [MessageFlags.Ephemeral]
        });
    }
});

client.on('guildMemberAdd', async (member) => {
    console.log(`[Gateway] ${member.user.tag} has joined the server.`);

    const record = dbQueries.getUserByDiscordId(member.id);
    if (!record) {
        console.log(`[Gateway] User ${member.user.tag} is not verified yet. Skipping auto-sync.`);
        return;
    }

    try {
        console.log(`[Gateway Auto-syncing verified user: ${record.roblox_username}]`);

        const result = await syncUserRolesAndName(member, record);

        if (result.success) {
            console.log(`[Gateway] Successfully auto-assigned roles for ${record.roblox_username}. Added: [${result.added.length}], Removed: [${result.removed.length}]`);
        }
    } catch (error) {
        console.error(`[Gateway Error] Failed to auto-sync for joining member ${member.id}:`, error.message);
    }
});

app.get('/oauth/callback', async (req, res) => {
    const { code, state } = req.query;

    if (!code || !state) {
        return res.status(400).send('Missing parameters from login sequence.');
    }

    const session = oauthStates.get(state);
    if (!session) {
        return res.status(400).send('Invalid or expired Session. Please run /verify again on Discord.');
    }

    try {
        const tokenResponse = await fetch('https://apis.roblox.com/oauth/v1/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: process.env.ROBLOX_OAUTH_CLIENT_ID,
                client_secret: process.env.ROBLOX_OAUTH_SECRET,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: process.env.ROBLOX_REDIRECT_URI
            })
        });

        const tokenData = await tokenResponse.json();
        if (!tokenResponse.ok) throw new Error(tokenData.error_description || 'Failed token exchange');

        const userResponse = await fetch('https://apis.roblox.com/oauth/v1/userinfo', {
            headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
        });

        const userData = await userResponse.json();
        if (!userResponse.ok) throw new Error('Failed to retrieve profile data.');

        const robloxId = userData.sub;
        const robloxUsername = userData.preferred_username;

        const { discordId, guildId } = session;
        oauthStates.delete(state);

        dbQueries.linkUser(robloxId, robloxUsername, discordId);

        try {
            if (guildId) {
                const guild = await client.guilds.fetch(guildId);
                const member = await guild.members.fetch(discordId).catch(() => null);

                if (member) {
                    console.log(`[Web OAuth] Instantly running background role-sync for ${robloxUsername}`);
                    const freshRecord = dbQueries.getUserByRobloxId(robloxId);
                    await syncUserRolesAndName(member, freshRecord);
                }
            }
        } catch (syncErr) {
            console.error(`[Web OAuth] Post-verification auto-sync failed:`, syncErr.message);
        }

        res.send(`<h1>Verification Successful!</h1><p>Welcome, ${robloxUsername}. Your Discord server roles have been automatically applied!</p>`);
    } catch (error) {
        console.error('OAuth Error:', error);
        res.status(500).send('An internal error occurred during verification.');
    }
});

app.get('/auth/roblox/login', (req, res) => {
    const state = crypto.randomBytes(16).toString('hex');
    webOAuthStates.add(state);

    const robloxAuthUrl = `https://apis.roblox.com/oauth/v1/authorize?` + new URLSearchParams({
        client_id: process.env.ROBLOX_OAUTH_CLIENT_ID,
        redirect_uri: process.env.ROBLOX_DASHBOARD_REDIRECT_URI || process.env.ROBLOX_REDIRECT_URI,
        response_type: 'code',
        scope: 'openid profile',
        state: state
    }).toString();

    res.redirect(robloxAuthUrl);
});

app.get('/auth/roblox/callback', async (req, res) => {
    const { code, state } = req.query;

    if (!webOAuthStates.has(state)) {
        return res.status(400).send('Invalid or expired login state.');
    }
    webOAuthStates.delete(state);

    try {
        const tokenResponse = await fetch('https://apis.roblox.com/oauth/v1/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: process.env.ROBLOX_OAUTH_CLIENT_ID,
                client_secret: process.env.ROBLOX_OAUTH_SECRET,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: process.env.ROBLOX_DASHBOARD_REDIRECT_URI || process.env.ROBLOX_REDIRECT_URI
            })
        });

        const tokenData = await tokenResponse.json();
        if (!tokenResponse.ok) throw new Error(tokenData.error_description || 'Failed token exchange');

        const userResponse = await fetch('https://apis.roblox.com/oauth/v1/userinfo', {
            headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
        });

        const userData = await userResponse.json();
        const robloxId = userData.sub;
        const robloxUsername = userData.preferred_username;

        dbQueries.linkUser(robloxId, robloxUsername);


        const GROUP_ID = '35708175';
        const groupFetch = await fetch(`https://groups.roblox.com/v1/users/${robloxId}/groups/roles`);
        const groupData = await groupFetch.json();
        
        const arafGroup = groupData.data?.find(g => g.group.id === parseInt(GROUP_ID, 10));

        const rankName = arafGroup ? arafGroup.role.name : 'Guest';
        const rankId = arafGroup ? arafGroup.role.rank : 0;
        
        let avatarUrl = '';
        try {
            const thumbnailFetch = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${robloxId}&size=150x150&format=Png&isCircular=true`);
            const thumbnailData = await thumbnailFetch.json();
            
            if (thumbnailData.data && thumbnailData.data.length > 0) {
                avatarUrl = thumbnailData.data[0].imageUrl;
            }
        } catch (thumbErr) {
            console.error('Failed to resolve Roblox avatar thumbnail:', thumbErr.message);
            avatarUrl = 'https://www.roblox.com/images/unsupported-avatar.png'; 
        }

        const userPayload = {
            robloxId: robloxId,
            username: robloxUsername,
            rankName: rankName,
            rankId: rankId,
            avatar: avatarUrl
        };

        const token = jwt.sign(userPayload, process.env.JWT_SECRET, { expiresIn: '6h' });

        res.cookie('araf_session', token, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: 6 * 60 * 60 * 1000 // 6 hours
        });

        res.redirect('http://localhost:5173/')

    } catch (error) {
        console.error('Web Dashboard Login Error:', error);
        res.status(500).send('Authentication failed on our end.');
    }
});

app.get('/api/servers', async (req, res) => {
    const servers = client.guilds.cache.map(g => ({ id: g.id, name: g.name }));
    res.json(servers);
});

app.get('/api/servers/:guildId/roles', async (req, res) => {
    try {
        const guild = await client.guilds.fetch(req.params.guildId);
        const roles = guild.roles.cache
            .filter(r => r.name !== '@everyone' && !r.managed)
            .map(r => ({ id: r.id, name: r.name }));
        res.json(roles);
    } catch (err) {
        res.status(500).send('Could not parse server target identities.');
    }
});

app.post('/api/groups/link', async (req, res) => {
    const { groupId } = req.body;
    if (!groupId) return res.status(400).send('Missing group parameter context.');

    const data = await fetchGroupRoleset(groupId);
    if (!data) return res.status(400).send('Roblox Group not found or API down.');

    dbQueries.addTrackedGroup(groupId, data.name);
    res.json({ success: true, name: data.name, roles: data.roles });
});

app.get('/api/groups/:groupId/roles', async (req, res) => {
    const data = await fetchGroupRoleset(req.params.groupId);
    if (!data) return res.status(404).send('Could not recover configuration details.');
    res.json(data.roles);
});

app.get('/api/binds', (req, res) => {
    res.json(dbQueries.getAllBinds());
});

app.post('/api/binds', (req, res) => {
    const { groupId, rank, roleName, discordRoleId, discordRoleName, cumulative } = req.body;

    if (!groupId || rank === undefined || !roleName || !discordRoleId || !discordRoleName) {
        return res.status(400).send('Missing body parameter definitions.');
    }

    try {
        const cumulativeFlag = cumulative ? 1 : 0;
        dbQueries.addBind(groupId, rank, roleName, discordRoleId, discordRoleName, cumulativeFlag);
        res.sendStatus(201);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.delete('/api/binds', (req, res) => {
    dbQueries.removeBind(req.query.groupId, parseInt(req.query.rank, 10));
    res.sendStatus(200);
});

app.get('/api/auth/me', (req, res) => {
    const cookies = req.headers.cookie;
    const token = cookies?.split('; ').find(row => row.startsWith('araf_session='))?.split('=')[1];

    if (!token) {
        return res.status(401).json({ authenticated: false, message: 'No session found.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        res.json({ authenticated: true, user: decoded });
    } catch (err) {
        res.status(401).json({ authenticated: false, message: 'Session expired or invalid.' });
    }
});

app.get('/api/members', (req, res) => {
    res.json(dbQueries.getAllUsers())
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Web Server listening on http://localhost:${PORT}`));
client.login(process.env.DISCORD_BOT_TOKEN);