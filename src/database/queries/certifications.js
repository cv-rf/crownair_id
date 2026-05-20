import { db } from "../database.js";

export const certificationsQueries = {

    getCert: (id) => {
        return db.prepare(`
            SELECT *
            FROM certifications
            WHERE id = ?
        `).get(id);
    },

    getAllCerts: () => {
        return db.prepare(`
            SELECT *
            FROM certifications
        `).all();
    },

    createCert: (
        name,
        abbreviation,
        description,
        expiry_days,
        prerequisite_cert_id
    ) => {
        return db.prepare(`
            INSERT INTO certifications (
                name,
                abbreviation,
                description,
                expiry_days,
                prerequisite_cert_id
            )
            VALUES (?, ?, ?, ?, ?)
        `).run(
            name,
            abbreviation,
            description,
            expiry_days ?? null,
            prerequisite_cert_id ?? null
        );
    },

    updateCert: (id, name, abbreviation, description, expiry_days, prerequisite_cert_id) => {
        return db.prepare(`
            UPDATE certifications SET name = ?, abbreviation = ?, description = ?, expiry_days = ?, prerequisite_cert_id = ?
            WHERE id = ?
        `).run(name, abbreviation, description, expiry_days ?? null, prerequisite_cert_id ?? null, id);
    },
    
    deleteCert: (id) => db.prepare('DELETE FROM certifications WHERE id = ?').run(id),

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

};