import Database from "better-sqlite3";
import { join, dirname } from 'path';
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new Database(join(__dirname, '../../database.db'));

const initDatabase = () => {
    db.pragma('journal_mode = WAL');

    db.prepare(`
        CREATE TABLE IF NOT EXISTS users (
            discord_id TEXT PRIMARY KEY,
            roblox_id TEXT NOT NULL,
            roblox_username TEXT
        )
    `).run();

    db.prepare(`
        CREATE TABLE IF NOT EXISTS tracked_groups (
            group_id TEXT PRIMARY KEY,
            group_name TEXT NOT NULL
        )
    `).run();

    db.prepare(`
        CREATE TABLE IF NOT EXISTS group_binds (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            group_id TEXT NOT NULL,
            roblox_rank INTEGER NOT NULL,
            roblox_role_name TEXT NOT NULL,
            discord_role_id TEXT NOT NULL,
            cumulative INTEGER DEFAULT 0
        )
    `).run();
};

initDatabase();

export const dbQueries = {
    linkUser: (discordId, robloxId, username) => {
        const stmt = db.prepare(`
            INSERT INTO users (discord_id, roblox_id, roblox_username)
            VALUES (?, ?, ?)
            ON CONFLICT(discord_id) DO UPDATE SET
                roblox_id = excluded.roblox_id,
                roblox_username = excluded.roblox_username
        `);
        return stmt.run(discordId, robloxId, username);
    },
    getUser: (discordId) => {
        return db.prepare('SELECT * FROM users WHERE discord_id = ?').get(discordId);
    },
    getUserByRobloxName: (username) => {
        return db.prepare('SELECT * FROM users WHERE LOWER(roblox_username) = LOWER(?)').get(username);
    },

    addTrackedGroup: (groupId, groupName) => {
        return db.prepare(`INSERT INTO tracked_groups (group_id, group_name) VALUES (?, ?) ON CONFLICT(group_id) DO UPDATE SET group_name = excluded.group_name`).run(groupId, groupName);
    },
    getTrackedGroups: () => db.prepare('SELECT * FROM tracked_groups').all(),
    removeTrackedGroup: (groupId) => {
        db.prepare('DELETE FROM group_binds WHERE group_id = ?').run(groupId);
        return db.prepare('DELETE FROM tracked_groups WHERE group_id = ?').run(groupId);
    },

    getBind: (groupId, rank) => db.prepare('SELECT * FROM group_binds WHERE group_id = ? AND roblox_rank = ?').get(groupId, rank),
    getAllBinds: () => db.prepare('SELECT * FROM group_binds').all(),
    addBind: (groupId, rank, roleName, discordRoleId, cumulative = 0) => {
        return db.prepare(`
            INSERT INTO group_binds (group_id, roblox_rank, roblox_role_name, discord_role_id, cumulative)
            VALUES (?, ?, ?, ?, ?)    
        `).run(groupId, rank, roleName, discordRoleId, cumulative);
    },
    removeBind: (groupId, rank) => {
        return db.prepare('DELETE FROM group_binds WHERE group_id = ? AND roblox_rank = ?').run(groupId, rank);
    }
};