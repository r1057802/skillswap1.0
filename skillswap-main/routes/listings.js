// listings.js
// -------------------------
// Import packages
// -------------------------
const express = require('express');
const router = express.Router();

const prisma = require('../lib/prisma');

const sessionAuth = require('../middleware/sessionAuth');

// -------------------------
// [POST] Listings (auth required)
// return created listing
// -------------------------
router.post('/', sessionAuth, async (req, res) => {
  const {
    categoryId,
    type,
    title,
    description,
    availability,
    imageUrl,
    country,
    city,
    latitude,
    longitude,
  } = req.body || {};

  const ownerId = req.session?.user?.id;
  if (!ownerId) {
    res.json({ error: 'Not authenticated' });
    return;
  }

  if (!categoryId || !type || !title) {
    res.json({ error: 'categoryId, type and title are required' });
    return;
  }

  const listing = await prisma.listing.create({
    data: {
      ownerId: Number(ownerId),
      categoryId: Number(categoryId),
      type,
      title,
      description,
      availability: Array.isArray(availability) ? JSON.stringify(availability) : availability,
      imageUrl,
      country,
      city,
      latitude,
      longitude,
    },
  });

  res.json(listing);
});

// -------------------------
// [GET] Listings 
// return array with counts
// -------------------------
router.get('/', async (_req, res) => {
  const listings = await prisma.listing.findMany({
    where: { deletedAt: null },
    include: {
      owner: true,
      category: true,
      _count: { select: { favorites: true } },
    },
    orderBy: { id: 'desc' },
  });
  res.json(listings);
});

// -------------------------
// [GET] Listings/:id 
// return listing
// -------------------------
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.json({ error: 'Invalid id' });
    return;
  }

  const listing = await prisma.listing.findFirst({
    where: { id, deletedAt: null },
    include: {
      owner: true,
      category: true,
      _count: { select: { favorites: true } },
    },
  });

  if (!listing) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  res.json(listing);
});

// -------------------------
// [POST] Listings/:id/favorite (auth)
// return upserted favorite
// -------------------------
router.post('/:id/favorite', sessionAuth, async (req, res) => {
  const listingId = Number(req.params.id);
  const userId = Number(req.session?.user?.id);

  if (!Number.isInteger(listingId) || listingId <= 0) {
    res.json({ error: 'Invalid listing id' });
    return;
  }
  if (!Number.isInteger(userId) || userId <= 0) {
    res.json({ error: 'Not authenticated' });
    return;
  }

  const listing = await prisma.listing.findFirst({ where: { id: listingId, deletedAt: null } });
  if (!listing) {
    res.status(404).json({ error: 'Listing not found' });
    return;
  }

  const fav = await prisma.favorite.upsert({
    where: { userId_listingId: { userId, listingId } },
    update: {},
    create: { userId, listingId },
  });

  res.json(fav);
});

// -------------------------
// [DELETE] Listings/:id/favorite (auth)
// return { ok: true }
// -------------------------
router.delete('/:id/favorite', sessionAuth, async (req, res) => {
  const listingId = Number(req.params.id);
  const userId = Number(req.session?.user?.id);

  if (!Number.isInteger(listingId) || listingId <= 0) {
    res.json({ error: 'Invalid listing id' });
    return;
  }
  if (!Number.isInteger(userId) || userId <= 0) {
    res.json({ error: 'Not authenticated' });
    return;
  }

  const listing = await prisma.listing.findFirst({ where: { id: listingId, deletedAt: null } });
  if (!listing) {
    res.status(404).json({ error: 'Listing not found' });
    return;
  }

  try {
    await prisma.favorite.delete({ where: { userId_listingId: { userId, listingId } } });
  } catch (e) {}

  res.json({ ok: true });
});

// -------------------------
// [POST] Listings/:id/bookings (auth)
// return created booking ==> doent book just mmessage
// -------------------------
router.post('/:id/bookings', sessionAuth, async (req, res) => {
  const listingId = Number(req.params.id);
  const userId = Number(req.session?.user?.id);
  const message = req.body?.message;
  const scheduledAt = req.body?.scheduledAt;

  if (!Number.isInteger(listingId) || listingId <= 0) {
    res.json({ error: 'Invalid listing id' });
    return;
  }
  if (!Number.isInteger(userId) || userId <= 0 || !scheduledAt) {
    res.json({ error: 'scheduledAt is required (and login)' });
    return;
  }

  const when = new Date(scheduledAt);

  const conflict = await prisma.booking.findFirst({
    where: { listingId, date: when, deletedAt: null },
  });
  if (conflict) {
    res.status(409).json({ error: 'Booking already exists for this listing and time' });
    return;
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { ownerId: true, availability: true },
  });
  if (!listing) {
    res.json({ error: 'Listing not found' });
    return;
  }

  // Availability check (reuse helper idea from bookings route)
  const slots = (() => {
    if (!listing.availability) return [];
    try {
      const parsed = JSON.parse(listing.availability);
      if (Array.isArray(parsed)) return parsed;
    } catch (_) {}
    return String(listing.availability)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  })();
  if (slots.length) {
    const targetMs = when.getTime();
    const ok = slots.some((s) => {
      const d = new Date(s);
      return !Number.isNaN(d.getTime()) && d.getTime() === targetMs;
    });
    if (!ok) {
      res.status(400).json({ error: 'Slot not available' });
      return;
    }
  }

  const booking = await prisma.booking.create({
    data: { listingId, ownerId: listing.ownerId, userId, message, date: when, status: 'pending' },
  });

  res.json(booking);
});

// -------------------------
// [DELETE] Listings/:id (admin only, soft delete)
// -------------------------
router.delete('/:id', sessionAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.json({ error: 'Invalid id' });
  }

  if (req.session?.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const current = await prisma.listing.findUnique({ where: { id } });
  if (!current || current.deletedAt) {
    return res.status(204).send();
  }

  await prisma.listing.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return res.status(204).send();
});

module.exports = router;
