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

const mailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
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

// -------------------------
// [POST] /auth/forgot-password
// body: { email }
// generates a one-time token and "sends" it (console.log)
// -------------------------
router.post('/forgot-password', async (req, res) => {
  const email = req.body?.email;
  if (!email) {
    res.json({ error: 'email is required' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Altijd een "ok" teruggeven, ook als user niet bestaat,
  // zodat je niet kunt raden welke emails geregistreerd zijn.
  if (!user || user.deletedAt) {
    res.json({ ok: true });
    return;
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 uur geldig

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: token,
      passwordResetTokenExpiresAt: expires,
    },
  });

  const resetUrlBase = process.env.FRONTEND_BASE_URL || 'http://localhost:5173/reset-password';
  const resetUrl = `${resetUrlBase}?token=${token}`;

  try {
    await mailTransporter.sendMail({
      from: process.env.MAIL_FROM || 'no-reply@skillswap.local',
      to: updated.email,
      subject: 'Wachtwoord resetten',
      text: `Je hebt gevraagd om je wachtwoord te resetten.\n\nKlik op deze link (1 uur geldig):\n${resetUrl}\n\nAls jij dit niet was, mag je deze mail negeren.`,
    });
  } catch (err) {
    console.error('Error sending reset email', err);
    // fallback: toon de token in de logs zodat je in development verder kan
    console.log(`Password reset token for ${email}: ${token}`);
  }

  res.json({ ok: true });
});

// -------------------------
// [POST] /auth/reset-password
// body: { token, newPassword }
// uses token from forgot-password flow
// -------------------------
router.post('/reset-password', async (req, res) => {
  const token = req.body?.token;
  const newPassword = req.body?.newPassword;

  if (!token || !newPassword) {
    res.json({ error: 'token and newPassword are required' });
    return;
  }

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetTokenExpiresAt: { gt: new Date() },
      deletedAt: null,
    },
  });

  if (!user) {
    res.json({ error: 'Invalid or expired token' });
    return;
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

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
// [POST] /auth/change-password
// body: { currentPassword, newPassword }
// only for logged-in user
// -------------------------
router.post('/change-password', sessionAuth, async (req, res) => {
  const userId = req.session?.user?.id;
  const currentPassword = req.body?.currentPassword;
  const newPassword = req.body?.newPassword;

  if (!currentPassword || !newPassword) {
    res.json({ error: 'currentPassword and newPassword are required' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.deletedAt) {
    res.json({ error: 'User not found' });
    return;
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    res.json({ error: 'Invalid current password' });
    return;
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

  res.json({ ok: true });
});

module.exports = router;
