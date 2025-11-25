// auth.js
// -------------------------
// Import packages
// -------------------------
const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const router = express.Router();
const prisma = require('../lib/prisma');
const sessionAuth = require('../middleware/sessionAuth');

const transporter = (() => {
  if (!process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Boolean(process.env.SMTP_SECURE === 'true'),
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
})();

async function sendResetEmail(email, token) {
  if (!transporter) return;
  const from = process.env.SMTP_FROM || 'no-reply@example.com';
  const base = process.env.FRONTEND_RESET_URL || 'http://localhost:5173/reset-password';
  const resetUrl = `${base}?token=${encodeURIComponent(token)}`;
  await transporter.sendMail({
    from,
    to: email,
    subject: 'Wachtwoord resetten',
    text: `Klik op deze link om je wachtwoord te resetten: ${resetUrl}`,
    html: `<p>Klik op deze link om je wachtwoord te resetten:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
  });
}

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
// [POST] /auth/forgot-password
// body: { email }
// -------------------------
router.post('/forgot-password', async (req, res) => {
  const email = req.body?.email?.trim();
  if (!email) {
    return res.json({ error: 'Email is verplicht' });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.json({ ok: true });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 1000 * 60 * 60);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordResetToken: token, passwordResetTokenExpiresAt: expires },
  });

  try {
    await sendResetEmail(email, token);
  } catch (e) {
    return res.json({ ok: true, warning: 'Reset link kon niet worden gemaild' });
  }

  res.json({ ok: true });
});

// -------------------------
// [POST] /auth/reset-password
// body: { token, password }
// -------------------------
router.post('/reset-password', async (req, res) => {
  const token = req.body?.token;
  const password = req.body?.password;

  if (!token || !password) {
    return res.json({ error: 'token en password zijn verplicht' });
  }

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetTokenExpiresAt: { gt: new Date() },
    },
  });

  if (!user) {
    return res.json({ error: 'Ongeldige of verlopen token' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetToken: null,
      passwordResetTokenExpiresAt: null,
    },
  });

  res.json({ ok: true });
});

// -------------------------
// [POST] /auth/change-password (auth)
// body: { oldPassword, newPassword }
// -------------------------
router.post('/change-password', sessionAuth, async (req, res) => {
  const userId = req.session?.user?.id;
  const oldPassword = req.body?.oldPassword;
  const newPassword = req.body?.newPassword;

  if (!oldPassword || !newPassword) {
    return res.json({ error: 'oldPassword en newPassword zijn verplicht' });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return res.status(404).json({ error: 'User niet gevonden' });
  }

  const valid = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!valid) {
    return res.json({ error: 'Oud wachtwoord klopt niet' });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  res.json({ ok: true });
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
