// sessions.js

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
// [POST] /sessions
// Create audit session entry (login event)
// --------------------------------------------------
router.post('/', async (req, res) => {
  const userId = Number(req.session.user.id);
  const role = req.session.user.role || 'user';

  const item = await prisma.session.create({
    data: { userId, role, loginTime: new Date() },
  });

  res.json(item);
});

// --------------------------------------------------
// [PATCH] /sessions/:id/logout
// Mark session logout time
// --------------------------------------------------
router.patch('/:id/logout', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    res.json({ error: 'Invalid id' });
    return;
  }

  const current = await prisma.session.findUnique({ where: { id } });
  if (!current) {
    res.json({ error: 'Session not found' });
    return;
  }

  if (current.userId !== req.session.user.id && req.session.user.role !== 'admin') {
    res.json({ error: 'Forbidden' });
    return;
  }

  const item = await prisma.session.update({
    where: { id },
    data: { logoutTime: new Date() },
  });

  res.json(item);
});

module.exports = router;
