const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const sessionAuth = require('../middleware/sessionAuth');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const safeName = file.originalname.replace(/\s+/g, '-');
    cb(null, `${unique}-${safeName}`);
  },
});

const upload = multer({ storage });

// Auth required (any logged-in user)
router.post('/', sessionAuth, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file' });
  }
  const url = `/uploads/${req.file.filename}`;
  res.json({ url });
});

module.exports = router;
