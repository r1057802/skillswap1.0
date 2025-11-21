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

// -------------------------
// [POST] Notifications (admin) 
// create notification for a user
// body: { userId?, username?, type, payload }
// -------------------------
router.post('/', async (req, res) => {
  if (req.session?.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const type = req.body?.type;
  const payload = req.body?.payload || null;
  const userIdRaw = req.body?.userId;
  const username = req.body?.username;

  if (!type) {
    return res.json({ error: 'type is required' });
  }

  let targetUser = null;

  if (username) {
    targetUser = await prisma.user.findUnique({ where: { username } });
  } else if (userIdRaw) {
    const userId = Number(userIdRaw);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.json({ error: 'Invalid userId' });
    }
    targetUser = await prisma.user.findUnique({ where: { id: userId } });
  } else {
    return res.json({ error: 'username or userId is required' });
  }

  if (!targetUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  const notif = await prisma.notification.create({
    data: { userId: targetUser.id, type, payload },
  });

  res.json(notif);
});

module.exports = router;
