import { dbQueries } from '../database/db.js';

const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const ranks = dbQueries.getAllRanks();
        res.json(ranks);
    } catch (error) {
        console.error('Error fetching ranks:', error);
        res.status(500).json({ error: 'Failed to fetch ranks' });
    }
});

router.get('/requirements', async (req, res) => {
    try {
        const result = await db
    } catch (error) {
        console.error('Error fetching requirements:', error);
        res.status(500).json({ error: 'Failed to fetch rank requirements' });
    }
});