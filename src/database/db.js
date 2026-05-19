import Database from "better-sqlite3";
import { join, dirname } from 'path';
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new Database(join(__dirname, '../../database.db'));

const initDatabase = () => {
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    db.prepare(`
        CREATE TABLE IF NOT EXISTS users (
            roblox_id TEXT PRIMARY KEY,
            discord_id TEXT UNIQUE,
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
            discord_role_name TEXT NOT NULL DEFAULT 'Unknown Role',
            cumulative INTEGER DEFAULT 0
        )
    `).run();

    db.prepare(`
        CREATE TABLE IF NOT EXISTS certifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            abbreviation TEXT NOT NULL,
            description TEXT,
            expiry_days INTEGER,
            prerequisite_cert_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (prerequisite_cert_id) REFERENCES certifications(id)
        )
    `).run();

    db.prepare(`
        CREATE TABLE IF NOT EXISTS member_certs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            roblox_id TEXT NOT NULL,
            cert_id INTEGER NOT NULL,
            awarded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME,
            awarded_by TEXT NOT NULL,
            FOREIGN KEY (roblox_id) REFERENCES users(roblox_id),
            FOREIGN KEY (cert_id) REFERENCES certifications(id)
        )
    `).run();

    db.prepare(`
        CREATE TABLE IF NOT EXISTS ranks (
            id INTEGER PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            insignia_url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `).run();

    db.prepare(`
        CREATE TABLE IF NOT EXISTS rank_requirements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            rank_id INT NOT NULL,
            cert_id INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_rank FOREIGN KEY (rank_id) REFERENCES ranks(id) ON DELETE CASCADE
            FOREIGN KEY (cert_id) REFERENCES certifications(id) ON DELETE CASCADE
        )
    `).run();
};

initDatabase();

export const dbQueries = {
    // Users
    linkUser: (robloxId, robloxUsername, discordId = null) => {
        return db.prepare(`
            INSERT INTO users (roblox_id, roblox_username, discord_id)
            VALUES (?, ?, ?)
            ON CONFLICT(roblox_id) DO UPDATE SET
                roblox_username = excluded.roblox_username,
                discord_id = COALESCE(excluded.discord_id, discord_id)
        `).run(robloxId, robloxUsername, discordId);
    },
    getUserByRobloxId: (robloxId) => {
        return db.prepare('SELECT * FROM users WHERE roblox_id = ?').get(robloxId);
    },
    getUserByDiscordId: (discordId) => {
        return db.prepare('SELECT * FROM users WHERE discord_id = ?').get(discordId);
    },
    getUserByRobloxName: (username) => {
        return db.prepare('SELECT * FROM users WHERE LOWER(roblox_username) = LOWER(?)').get(username);
    },
    getAllUsers: () => db.prepare('SELECT * FROM users').all(),

    // Tracked groups
    addTrackedGroup: (groupId, groupName) => {
        return db.prepare(`
            INSERT INTO tracked_groups (group_id, group_name) VALUES (?, ?)
            ON CONFLICT(group_id) DO UPDATE SET group_name = excluded.group_name
        `).run(groupId, groupName);
    },
    getTrackedGroups: () => db.prepare('SELECT * FROM tracked_groups').all(),
    removeTrackedGroup: (groupId) => {
        db.prepare('DELETE FROM group_binds WHERE group_id = ?').run(groupId);
        return db.prepare('DELETE FROM tracked_groups WHERE group_id = ?').run(groupId);
    },

    // Binds
    getBind: (groupId, rank) => db.prepare('SELECT * FROM group_binds WHERE group_id = ? AND roblox_rank = ?').get(groupId, rank),
    getAllBinds: () => db.prepare('SELECT * FROM group_binds').all(),
    addBind: (groupId, rank, roleName, discordRoleId, discordRoleName, cumulative = 0) => {
        return db.prepare(`
            INSERT INTO group_binds (group_id, roblox_rank, roblox_role_name, discord_role_id, discord_role_name, cumulative)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(groupId, rank, roleName, discordRoleId, discordRoleName, cumulative);
    },
    removeBind: (groupId, rank) => {
        return db.prepare('DELETE FROM group_binds WHERE group_id = ? AND roblox_rank = ?').run(groupId, rank);
    },

    // Certifications
    getCert: (id) => db.prepare('SELECT * FROM certifications WHERE id = ?').get(id),
    getAllCerts: () => db.prepare('SELECT * FROM certifications').all(),
    createCert: (name, abbreviation, description, expiry_days, prerequisite_cert_id) => {
        return db.prepare(`
            INSERT INTO certifications (name, abbreviation, description, expiry_days, prerequisite_cert_id)
            VALUES (?, ?, ?, ?, ?)
        `).run(name, abbreviation, description, expiry_days ?? null, prerequisite_cert_id ?? null);
    },
    updateCert: (id, name, abbreviation, description, expiry_days, prerequisite_cert_id) => {
        return db.prepare(`
            UPDATE certifications SET name = ?, abbreviation = ?, description = ?, expiry_days = ?, prerequisite_cert_id = ?
            WHERE id = ?
        `).run(name, abbreviation, description, expiry_days ?? null, prerequisite_cert_id ?? null, id);
    },
    deleteCert: (id) => db.prepare('DELETE FROM certifications WHERE id = ?').run(id),

    // Member certifications
    getMemberCerts: (robloxId) => {
        return db.prepare(`
            SELECT mc.*, c.name, c.abbreviation, c.description, c.expiry_days
            FROM member_certs mc
            JOIN certifications c ON mc.cert_id = c.id
            WHERE mc.roblox_id = ?
        `).all(robloxId);
    },
    getAllMemberCerts: () => {
        return db.prepare(`
            SELECT mc.*, c.name, c.abbreviation, c.description, u.roblox_username
            FROM member_certs mc
            JOIN certifications c ON mc.cert_id = c.id
            JOIN users u ON mc.roblox_id = u.roblox_id
        `).all();
    },
    awardCert: (robloxId, certId, awardedBy, expiresAt) => {
        return db.prepare(`
            INSERT INTO member_certs (roblox_id, cert_id, awarded_by, expires_at)
            VALUES (?, ?, ?, ?)
        `).run(robloxId, certId, awardedBy, expiresAt ?? null);
    },
    revokeCert: (id) => db.prepare('DELETE FROM member_certs WHERE id = ?').run(id),
    getMemberCert: (robloxId, certId) => {
        return db.prepare('SELECT * FROM member_certs WHERE roblox_id = ? AND cert_id = ?').get(robloxId, certId);
    },

    // Ranks
    getAllRanks: () => {
        return db.prepare('SELECT * FROM ranks ORDER BY id ASC').all();
    },

    // Requirements
    getRankRequirements: () => {
        return db.prepare(`
            SELECT rr.*, r.name AS rank_name, c.name AS cert_name
            FROM rank_requirements rr
            JOIN ranks r ON rr.rank_id = r.id
            JOIN certifications c ON rr.cert_id = c.id
        `).all();
    }
};