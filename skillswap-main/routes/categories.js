// categories.js

// --------------------------------------------------
// Import packages
// --------------------------------------------------
const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const sessionAuth = require('../middleware/sessionAuth');

// --------------------------------------------------
// [POST] /categories (admin)
// Create category
// --------------------------------------------------
router.post('/', sessionAuth, async (req, res) => {
  if (req.session.user.role !== 'admin') {
    res.json({ error: 'Admin only' });
    return;
  }

  const name = req.body.name;
  const slug = req.body.slug;

 	if (!name || !slug) {
    res.json({ error: 'name and slug are required' });
    return;
  }

  const category = await prisma.category.create({
    data: { name: String(name).trim(), slug: String(slug).trim().toLowerCase() },
  });

  res.json(category);
});

// --------------------------------------------------
// [GET] /categories (public)
// Return all categories
// --------------------------------------------------
router.get('/', async (_req, res) => {
  const categories = await prisma.category.findMany();
  res.json(categories);
});

// --------------------------------------------------
// [PATCH] /categories/:id (admin)
// Update category
// --------------------------------------------------
router.patch('/:id', sessionAuth, async (req, res) => {
  if (req.session.user.role !== 'admin') {
    res.json({ error: 'Admin only' });
    return;
  }

  const id = Number(req.params.id);
  const { name, slug } = req.body || {};

  if (!Number.isInteger(id) || id <= 0) {
    res.json({ error: 'Invalid id' });
    return;
  }

  const data = {};
  if (name) data.name = String(name).trim();
  if (slug) data.slug = String(slug).trim().toLowerCase();

  const category = await prisma.category.update({ where: { id }, data });
  res.json(category);
});

// --------------------------------------------------
// [DELETE] /categories/:id (admin)
// Delete category
// --------------------------------------------------
router.delete('/:id', sessionAuth, async (req, res) => {
  if (req.session.user.role !== 'admin') {
    res.json({ error: 'Admin only' });
    return;
  }

  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.json({ error: 'Invalid id' });
    return;
  }

  const deleted = await prisma.category.delete({ where: { id } });
  res.json(deleted);
});

module.exports = router;
