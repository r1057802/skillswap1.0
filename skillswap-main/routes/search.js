// search.js

// --------------------------------------------------
// Import packages
// --------------------------------------------------
const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');

// --------------------------------------------------
// [GET] /search?query=tekst
// Full-text style search on listings
// --------------------------------------------------
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
          { title: { contains: query } },
          { description: { contains: query } },
          { city: { contains: query } },
          { country: { contains: query } },
        ],
      },
      take: 50,
      orderBy: { createdAt: 'desc' },
    });

    res.json({ results: listings, query });
  } catch (err) {
    console.error('search error', err);
    res.status(500).json({ error: 'Zoeken mislukt' });
  }
});

module.exports = router;
