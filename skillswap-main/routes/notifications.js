// notifications.js
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
// [GET] Notifications 
// return array (eigen user)
// -------------------------
router.get('/', async (req, res) => {
  const userId = Number(req.session?.user?.id);

  const items = await prisma.notification.findMany({
    where: { userId },
    orderBy: { id: 'desc' },
  });

  res.json(items);
});

// -------------------------
// [POST] Notifications
// body: { userId, type, payload? }
// alleen admin kan notificatie voor een user maken
// -------------------------
router.post('/', async (req, res) => {
  const me = req.session?.user;
  if (!me || me.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const userId = Number(req.body?.userId);
  const type = req.body?.type;
  const payload = req.body?.payload ?? null;

  if (!Number.isInteger(userId) || userId <= 0 || !type) {
    res.status(400).json({ error: 'userId and type are required' });
    return;
  }

  const exists = await prisma.user.findUnique({ where: { id: userId } });
  if (!exists) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const item = await prisma.notification.create({
    data: { userId, type, payload },
  });

  res.status(201).json(item);
});

// -------------------------
// [PATCH] Notifications/:id/read 
// return updated notification
// -------------------------
router.patch('/:id/read', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.json({ error: 'Invalid id' });
    return;
  }

  const current = await prisma.notification.findUnique({ where: { id } });
  if (!current) {
    res.json({ error: 'Notification not found' });
    return;
  }

  if (current.userId !== req.session.user.id && req.session.user.role !== 'admin') {
    res.json({ error: 'Forbidden' });
    return;
  }

  const item = await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });

  res.json(item);
});

module.exports = router;
