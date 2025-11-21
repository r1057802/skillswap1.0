// auth.js
// -------------------------
// Import packages
// -------------------------
const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const prisma = require('../lib/prisma');

// -------------------------
// [POST] /auth/bootstrap-admin
// Temporary helper to create the first admin.
// Enable by setting BOOTSTRAP_ADMIN_KEY in .env and sending it via header `x-bootstrap-key` or body { key }.
// Remember to remove the env var and restart after use.
// -------------------------
router.post('/bootstrap-admin', async (req, res) => {
  // If not explicitly enabled, deny.
  if (!process.env.BOOTSTRAP_ADMIN_KEY) {
    return res.status(403).json({ error: 'bootstrap disabled' });
  }

  const key = req.headers['x-bootstrap-key'] || req.body?.key;
  if (key !== process.env.BOOTSTRAP_ADMIN_KEY) {
    return res.status(403).json({ error: 'forbidden' });
  }

  // Avoid multiple admins created this way.
  const existingAdmin = await prisma.user.findFirst({ where: { role: 'admin' } });
  if (existingAdmin) {
    return res.json({ error: 'admin already exists' });
  }

  const {
    email = 'admin@example.com',
    username = 'admin',
    password = 'changeme',
  } = req.body || {};

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { username, email, passwordHash, role: 'admin' },
  });

  const { passwordHash: _ph, ...safe } = user;
  return res.json({ created: true, user: safe });
});

// -------------------------
// [POST] /auth/register
// body: { username, email, password }
// return created user (safe)
// -------------------------
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body || {};

  if (!username || !email || !password) {
    res.json({ error: 'username, email and password are required' });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.json({ error: 'Email already registered' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { username, email, passwordHash, role: 'user' },
  });

  const { passwordHash: _ph, ...safe } = user;
  req.session.user = safe;
  res.json(safe);
});

// -------------------------
// [POST] /auth/login
// body: { email, password }
// return user (safe)
// -------------------------
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    res.json({ error: 'email and password are required' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.json({ error: 'Invalid credentials' });
    return;
  }

  if (user.deletedAt) {
    res.json({ error: 'Account is deactivated' });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.json({ error: 'Invalid credentials' });
    return;
  }

  const { passwordHash: _ph, ...safe } = user;
  req.session.user = safe;
  res.json(safe);
});

// -------------------------
// [POST] /auth/logout
// -------------------------
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// -------------------------
// [GET] /auth/me
// return current session user
// -------------------------
router.get('/me', (req, res) => {
  if (!req.session.user) {
    res.json({ error: 'Not logged in' });
    return;
  }
  res.json(req.session.user);
});

module.exports = router;
