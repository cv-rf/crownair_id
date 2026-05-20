import { db } from "./database.js";

export const initDatabase = () => {

    db.prepare(`
        CREATE TABLE IF NOT EXISTS users (
            roblox_id TEXT PRIMARY KEY,
            discord_id TEXT UNIQUE,
            roblox_username TEXT
        )
    `).run();

    db.prepare(`
        CREATE TABLE IF NOT EXISTS user_ranks (
            roblox_id TEXT PRIMARY KEY,
            rank_id INTEGER NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_by TEXT,
            FOREIGN KEY (roblox_id) REFERENCES users(roblox_id) ON DELETE CASCADE,
            FOREIGN KEY (rank_id) REFERENCES ranks(id)
        )
    `).run();

    db.prepare(`
        CREATE TABLE IF NOT EXISTS ranks (
            id INT PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            nato_code TEXT,
            description TEXT,
            priority INTEGER NOT NULL UNIQUE,
            discord_role_id TEXT,
            roblox_role_id TEXT,
            insignia_url TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
        CREATE TABLE IF NOT EXISTS rank_requirements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            rank_id INTEGER NOT NULL,
            cert_id INTEGER NOT NULL,
            FOREIGN KEY (rank_id) REFERENCES ranks(id) ON DELETE CASCADE,
            FOREIGN KEY (cert_id) REFERENCES certifications(id) ON DELETE CASCADE,
            UNIQUE(rank_id, cert_id)
        )
    `).run();
};

initDatabase();