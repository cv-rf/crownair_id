import { db } from "../database.js";

export const usersQueries = {
    
    linkUser: (robloxId, robloxUsername, discordId = null) => {
        return db.prepare(`
            INSERT INTO users (
                roblox_id,
                roblox_username,
                discord_id
            )
            VALUES (?, ?, ?)
            ON CONFLICT(roblox_id)
            DO UPDATE SET
                roblox_username = excluded.roblox_username,
                discord_id = COALESCE(
                    excluded.discord_id,
                    discord_id
                )
        `).run(
            robloxId,
            robloxUsername,
            discordId
        );
    },

    getUserByRobloxId: (robloxId) => {
        return db.prepare(`
            SELECT *
            FROM users
            WHERE roblox_id = ?
        `).get(robloxId);
    },

    getUserByDiscordId: (discordId) => {
        return db.prepare(`
            SELECT *
            FROM users
            WHERE discord_id = ?
        `).get(discordId);
    },

    getAllUsers: () => {
        return db.prepare(`
            SELECT *
            FROM users
        `).all();
    },

};