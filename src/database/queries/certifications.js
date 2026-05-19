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
        expiryDays,
        prerequisiteCertId
    ) => {
        return db.prepare(`
            INSERT INTO certifications (
                name,
                abbreviation,
                description,
                expiryDays,
                prerequisiteCertId
            )
            VALUES (?, ?, ?, ?, ?)
        `).run(
            name,
            abbreviation,
            description,
            expiryDays ?? null,
            prerequisiteCertId ?? null
        );
    },

};