const express = require('express');
const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');

const router = express.Router();

const MAP_HTML_PATH = path.join(__dirname, '..', 'map.html');
const PY_SCRIPT_PATH = path.join(__dirname, '..', 'generate_map.py');

const runPythonGenerator = () =>
  new Promise((resolve, reject) => {
    execFile(
      'python',
      [PY_SCRIPT_PATH],
      { timeout: 30000 },
      (error, _stdout, stderr) => {
        if (error) {
          return reject(error);
        }
        if (stderr) {
          console.warn('Folium map stderr:', stderr);
        }
        return resolve();
      }
    );
  });

const needsRefresh = () => {
  if (!fs.existsSync(MAP_HTML_PATH)) return true;
  const stats = fs.statSync(MAP_HTML_PATH);
  // regenerate after 5 minutes to keep markers in sync
  return Date.now() - stats.mtimeMs > 5 * 60 * 1000;
};

router.get('/', async (req, res) => {
  const force = req.query.regenerate === '1';

  try {
    if (force || needsRefresh()) {
      await runPythonGenerator();
    }
    return res.sendFile(MAP_HTML_PATH);
  } catch (err) {
    console.error('Kon kaart niet genereren', err);
    return res.status(500).json({ error: 'Kon kaart niet genereren' });
  }
});

module.exports = router;
