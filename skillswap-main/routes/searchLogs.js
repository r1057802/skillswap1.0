// searchLogs.js

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
// [POST] /search-logs
// Create search log entry
// --------------------------------------------------
router.post('/', async (req, res) => {
  const userId = Number(req.session.user.id);
  const query = req.body.query;

  if (!Number.isInteger(userId) || userId <= 0 || !query) {
    res.json({ error: 'query is required (and login)' });
    return;
  }

  const item = await prisma.searchLog.create({
    data: { userId, query },
  });

  res.json(item);
});

module.exports = router;
