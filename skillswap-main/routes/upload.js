// uploads.js

// --------------------------------------------------
// Import packages
// --------------------------------------------------
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const sessionAuth = require('../middleware/sessionAuth');

const router = express.Router();

// --------------------------------------------------
// Setup upload directory
// --------------------------------------------------
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// --------------------------------------------------
// Configure Multer storage
// --------------------------------------------------
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const safeName = file.originalname.replace(/\s+/g, '-');
    cb(null, `${unique}-${safeName}`);
  },
});

const upload = multer({ storage });

// --------------------------------------------------
// [POST] /uploads  (auth required)
// Upload a single file
// --------------------------------------------------
router.post('/', sessionAuth, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file' });
  }

  const url = `/uploads/${req.file.filename}`;
  res.json({ url });
});

module.exports = router;
