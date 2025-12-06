// favorites.js

// --------------------------------------------------
// Import packages
// --------------------------------------------------
const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const sessionAuth = require('../middleware/sessionAuth');

// --------------------------------------------------
// Middleware: authenticatie vereist
// --------------------------------------------------
router.use(sessionAuth);

// --------------------------------------------------
// [GET] /favorites
// Get all favorites for current user
// --------------------------------------------------
router.get('/', async (req, res) => {
  const userId = Number(req.session.user.id);

  const favorites = await prisma.favorite.findMany({
    where: { userId },
    include: {
      listing: {
        include: {
          category: true,
          _count: { select: { favorites: true } },
        },
      },
    },
  });

  res.json(favorites);
});

// --------------------------------------------------
// [POST] /favorites
// Add favorite
// --------------------------------------------------
router.post('/', async (req, res) => {
  const userId = Number(req.session.user.id);
  const listingId = Number(req.body.listingId);

  if (!Number.isInteger(userId) || !Number.isInteger(listingId)) {
    res.json({ error: 'listingId required' });
    return;
  }

  const favorite = await prisma.favorite.upsert({
    where: { userId_listingId: { userId, listingId } },
    update: {},
    create: { userId, listingId },
  });

  res.json(favorite);
});

// --------------------------------------------------
// [DELETE] /favorites/:listingId
// Remove favorite
// --------------------------------------------------
router.delete('/:listingId', async (req, res) => {
  const userId = Number(req.session.user.id);
  const listingId = Number(req.params.listingId);

  if (!Number.isInteger(userId) || !Number.isInteger(listingId)) {
    res.json({ error: 'Invalid ids' });
    return;
  }

  try {
    await prisma.favorite.delete({
      where: { userId_listingId: { userId, listingId } },
    });
  } catch (_) {}

  res.json({ ok: true });
});

module.exports = router;
