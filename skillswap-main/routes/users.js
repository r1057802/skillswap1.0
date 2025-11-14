// users.js
// -------------------------
// Import packages
// -------------------------
const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const prisma = require('../lib/prisma');
const sessionAuth = require('../middleware/sessionAuth');

// [REMOVED] Public create endpoint moved to /auth/register
// POST /users is intentionally removed to avoid duplication.



// -------------------------
// [GET] Users/:id (auth)
// return user (safe)
// -------------------------
router.get('/:id', sessionAuth, async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    res.json({ error: 'Invalid id' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || user.deletedAt) {
    res.json({ error: 'Not found' });
    return;
  }

  if (req.session.user.id !== id && req.session.user.role !== 'admin') {
    res.json({ error: 'Forbidden' });
    return;
  }

  const { passwordHash, ...safe } = user;
  res.json(safe);
});

// -------------------------
// [DELETE] Users/:id (soft delete)
// Only self or admin; sets deletedAt
// -------------------------
router.delete('/:id', sessionAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.json({ error: 'Invalid id' });
    return;
  }

  const me = req.session?.user;
  const isSelf = me && me.id === id;
  const isAdmin = me && me.role === 'admin';
  if (!isSelf && !isAdmin) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const current = await prisma.user.findUnique({ where: { id } });
  if (!current || current.deletedAt) {
    res.status(204).send();
    return;
  }

  await prisma.user.update({ where: { id }, data: { deletedAt: new Date() } });
  if (isSelf) {
    req.session.destroy(() => {});
  }
  res.status(204).send();
});

// -------------------------
// [POST] Users/admin (admin only)
// create a new admin user
// body: { username, email, password }
// -------------------------
router.post('/admin', sessionAuth, async (req, res) => {
  if (req.session?.user?.role !== 'admin') {
    res.json({ error: 'Admin only' });
    return;
  }

  const username = req.body?.username;
  const email = req.body?.email;
  const password = req.body?.password;

  if (!username || !email || !password) {
    res.json({ error: 'username, email and password are required' });
    return;
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    res.json({ error: 'Email already registered' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { username, email, passwordHash, role: 'admin' } });
  const { passwordHash: _ph, ...safe } = user;
  res.json(safe);
});

// -------------------------
// [PATCH] Users/:id/role (admin only)
// body: { role: 'user' | 'admin' }
// -------------------------
router.patch('/:id/role', sessionAuth, async (req, res) => {
  if (req.session?.user?.role !== 'admin') {
    res.json({ error: 'Admin only' });
    return;
  }

  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.json({ error: 'Invalid id' });
    return;
  }

  const role = req.body?.role;
  const allowed = ['user', 'admin'];
  if (!allowed.includes(role)) {
    res.json({ error: 'Invalid role' });
    return;
  }

  const user = await prisma.user.update({ where: { id }, data: { role } });
  const { passwordHash: _ph, ...safe } = user;
  res.json(safe);
});


module.exports = router;
