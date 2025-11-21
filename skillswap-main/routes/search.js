const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');

// GET /search?query=tekst
router.get('/', async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim() === '') {
      return res.status(400).json({ error: 'Query is verplicht' });
    }

    const listings = await prisma.listing.findMany({
      where: {
        deletedAt: null,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { city: { contains: query, mode: 'insensitive' } },
          { country: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 50,
      orderBy: { createdAt: 'desc' },
    });

    res.json({ results: listings, query });
  } catch (err) {
    res.status(500).json({ error: 'Zoeken mislukt' });
  }
});

module.exports = router;
