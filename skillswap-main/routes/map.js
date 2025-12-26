// map.js

// --------------------------------------------------
// Import packages
// --------------------------------------------------
const express = require('express');
const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');
const sessionAuth = require('../middleware/sessionAuth');

const router = express.Router();

// --------------------------------------------------
// File paths
// --------------------------------------------------
const MAP_HTML_PATH = path.join(__dirname, '..', 'map.html');
const PY_SCRIPT_PATH = path.join(__dirname, '..', 'generate_map.py');

// --------------------------------------------------
// Helper: run Python generator
// --------------------------------------------------
const runPythonGenerator = () =>
  new Promise((resolve, reject) => {
    execFile(
      'python',
      [PY_SCRIPT_PATH],
      { timeout: 30000 },
      (error, _stdout, stderr) => {
        if (error) return reject(error);
        if (stderr) console.warn('Folium map stderr:', stderr);
        resolve();
      }
    );
  });

// --------------------------------------------------
// Helper: check if map needs regeneration
// --------------------------------------------------
const needsRefresh = () => {
  if (!fs.existsSync(MAP_HTML_PATH)) return true;

  const stats = fs.statSync(MAP_HTML_PATH);

  return Date.now() - stats.mtimeMs > 5 * 60 * 1000;
};

// --------------------------------------------------
// [GET] /map
// Generate map (if needed) and return map.html
// --------------------------------------------------
router.get('/', async (req, res) => {
  const force = req.query.regenerate === '1';
  const isAdmin = req.session?.user?.role === 'admin';

  try {
    if (force && !isAdmin) {
      return res.status(403).json({ error: 'Alleen admin mag regenereren' });
    }

    const allowGenerate = force ? isAdmin : (isAdmin || !fs.existsSync(MAP_HTML_PATH));

    if (allowGenerate && (force || needsRefresh())) {
      await runPythonGenerator();
    }
    res.sendFile(MAP_HTML_PATH);
  } catch (err) {
    console.error('Kon kaart niet genereren', err);
    res.status(500).json({ error: 'Kon kaart niet genereren' });
  }
});

module.exports = router;
