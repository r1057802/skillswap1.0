// bookings.js
// -------------------------
// Import packages
// -------------------------
const express = require('express');
const router = express.Router();

const prisma = require('../lib/prisma');

const sessionAuth = require('../middleware/sessionAuth');

// -------------------------
// Middleware: authenticatie vereist
// -------------------------
router.use(sessionAuth);

// -------------------------
// [GET] Bookings 
// return array (own bookings; admin may pass ?userId=)
// -------------------------
router.get('/', async (req, res) => {
  const sessionUserId = Number(req.session?.user?.id);
  const isAdmin = req.session?.user?.role === 'admin';
  const qUserId = req.query?.userId ? Number(req.query.userId) : null;

  const where = isAdmin && Number.isInteger(qUserId) && qUserId > 0
    ? { userId: qUserId, deletedAt: null }
    : { userId: sessionUserId, deletedAt: null };

  const bookings = await prisma.booking.findMany({ where });
  res.json(bookings);
});

// -------------------------
// [GET] Bookings/:id 
// return booking (only own or admin)
// -------------------------
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.json({ error: 'Invalid id' });
    return;
  }

  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) {
    res.json({ error: 'Booking not found' });
    return;
  }
  if (booking.deletedAt) {
    res.json({ error: 'Booking not found' });
    return;
  }

  const isOwner = booking.userId === req.session.user.id || req.session.user.role === 'admin';
  if (!isOwner) {
    res.json({ error: 'Forbidden' });
    return;
  }

  res.json(booking);
});

// -------------------------
// [POST] Bookings 
// body: { listingId, scheduledAt, status? }
// return created booking
// -------------------------
router.post('/', async (req, res) => {
  const userId = Number(req.session?.user?.id);
  const listingId = Number(req.body?.listingId);
  const scheduledAt = req.body?.scheduledAt;
  const status = req.body?.status;

  if (!Number.isInteger(userId) || userId <= 0 || !Number.isInteger(listingId) || listingId <= 0 || !scheduledAt) {
    res.json({ error: 'listingId and scheduledAt are required (and login)' });
    return;
  }

  const d = new Date(scheduledAt);

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { ownerId: true, deletedAt: true },
  });
  if (!listing || listing.deletedAt) {
    res.json({ error: 'Listing not found' });
    return;
  }

  const existing = await prisma.booking.findFirst({ where: { listingId, date: d, deletedAt: null } });
  if (existing) {
    res.json({ error: 'Booking already exists for this listing and date' });
    return;
  }

  const allowed = ['pending', 'accepted', 'rejected', 'canceled'];
  const finalStatus = allowed.includes(status) ? status : 'pending';

  const booking = await prisma.booking.create({
    data: { userId, ownerId: listing.ownerId, listingId, date: d, status: finalStatus },
  });

  res.json(booking);
});

// -------------------------
// [PATCH] Bookings/:id 
// return updated booking
// -------------------------
router.patch('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.json({ error: 'Invalid id' });
    return;
  }

  const data = {
    date: req.body?.date,
    status: req.body?.status,
    listingId: req.body?.listingId,
  };

  if (data.listingId !== undefined) data.listingId = Number(data.listingId);
  if (data.date !== undefined) data.date = new Date(data.date);

  const current = await prisma.booking.findUnique({ where: { id } });
  if (!current) {
    res.json({ error: 'Booking not found' });
    return;
  }
  if (current.deletedAt) {
    res.json({ error: 'Booking not found' });
    return;
  }

  const isOwner = current.userId === req.session.user.id || req.session.user.role === 'admin';
  if (!isOwner) {
    res.json({ error: 'Forbidden' });
    return;
  }

  const targetListingId = data.listingId ?? current.listingId;
  const targetDate = data.date ?? current.date;

  if (data.listingId !== undefined || data.date !== undefined) {
    const conflict = await prisma.booking.findFirst({
      where: { listingId: targetListingId, date: targetDate, deletedAt: null, NOT: { id } },
    });
    if (conflict) {
      res.json({ error: 'Booking already exists for this listing and date' });
      return;
    }
  }

  if (data.listingId !== undefined && data.listingId !== current.listingId) {
    const listing = await prisma.listing.findUnique({
      where: { id: data.listingId },
      select: { ownerId: true },
    });
    if (!listing) {
      res.json({ error: 'Listing not found' });
      return;
    }
    data.ownerId = listing.ownerId;
  }

  const allowed = ['pending', 'accepted', 'rejected', 'canceled'];
  if (data.status !== undefined && !allowed.includes(data.status)) {
    res.json({ error: 'Invalid status' });
    return;
  }

  const booking = await prisma.booking.update({ where: { id }, data });
  res.json(booking);
});

// -------------------------
// [DELETE] Bookings/:id 
// return { ok: true }
// -------------------------
router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.json({ error: 'Invalid id' });
    return;
  }

  const current = await prisma.booking.findUnique({ where: { id } });
  if (!current) {
    res.json({ ok: true });
    return;
  }
  if (current.deletedAt) {
    res.json({ ok: true });
    return;
  }

  const me = req.session?.user;
  const isOwner = me && (current.userId === me.id || current.ownerId === me.id);
  const isAdmin = me && me.role === 'admin';
  if (!isOwner && !isAdmin) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  await prisma.booking.update({ where: { id }, data: { deletedAt: new Date() } });
  res.status(204).send();
});

module.exports = router;
