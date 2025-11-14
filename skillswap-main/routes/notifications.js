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
