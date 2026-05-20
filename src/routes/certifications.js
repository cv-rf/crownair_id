import express from 'express';
import { dbQueries } from '../database/index.js';

const router = express.Router();

// Get all certifications
router.get('/', (req, res) => {
    const certs = dbQueries.getAllCerts();
    res.json(certs);
});

// Get single cert
router.get('/:id', (req, res) => {
    const cert = dbQueries.getCert(req.params.id);
    if (!cert) return res.status(404).json({ error: 'Certification not found' });
    res.json(cert);
});

// Create cert
router.post('/', (req, res) => {
    const { name, abbreviation, description, expiry_days, prerequisite_cert_id } = req.body;
    if (!name || !abbreviation) return res.status(400).json({ error: 'Name and abbreviation are required' });

    try {
        const result = dbQueries.createCert(name, abbreviation, description, expiry_days, prerequisite_cert_id);
        res.status(201).json({ id: result.lastInsertRowid });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update cert
router.put('/:id', (req, res) => {
    const { name, abbreviation, description, expiry_days, prerequisite_cert_id } = req.body;
    if (!name || !abbreviation) return res.status(400).json({ error: 'Name and abbreviation are required' });

    try {
        dbQueries.updateCert(req.params.id, name, abbreviation, description, expiry_days, prerequisite_cert_id);
        res.sendStatus(200);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete cert
router.delete('/:id', (req, res) => {
    try {
        dbQueries.deleteCert(req.params.id);
        res.sendStatus(200);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all member certs
router.get('/members/all', (req, res) => {
    res.json(dbQueries.getAllMemberCerts());
});

// Get a specific member's certs
router.get('/members/:robloxId', (req, res) => {
    res.json(dbQueries.getMemberCerts(req.params.robloxId));
});

// Award cert to member
router.post('/members/award', (req, res) => {
    const { robloxId, certId, awardedBy } = req.body;
    if (!robloxId || !certId || !awardedBy) return res.status(400).json({ error: 'Missing required fields' });

    // Check member exists
    const member = dbQueries.getUserByRobloxId(robloxId);
    if (!member) return res.status(404).json({ error: 'Member not found' });

    // Check cert exists
    const cert = dbQueries.getCert(certId);
    if (!cert) return res.status(404).json({ error: 'Certification not found' });

    // Check prerequisite
    if (cert.prerequisite_cert_id) {
        const hasPrereq = dbQueries.getMemberCert(robloxId, cert.prerequisite_cert_id);
        if (!hasPrereq) return res.status(400).json({ error: 'Member does not have the prerequisite certification' });
    }

    // Check already has cert
    const alreadyHas = dbQueries.getMemberCert(robloxId, certId);
    if (alreadyHas) return res.status(400).json({ error: 'Member already holds this certification' });

    // Calculate expiry
    const expiresAt = cert.expiry_days
        ? new Date(Date.now() + cert.expiry_days * 86400000).toISOString()
        : null;

    try {
        dbQueries.awardCert(robloxId, certId, awardedBy, expiresAt);
        res.sendStatus(201);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Revoke cert
router.delete('/members/revoke/:id', (req, res) => {
    try {
        dbQueries.revokeCert(req.params.id);
        res.sendStatus(200);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;