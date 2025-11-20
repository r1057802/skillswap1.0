// server.js
// -------------------------
// Import packages
// -------------------------
const express = require('express');
const session = require('express-session');
const path = require('path');
const { execFile } = require('child_process');
const sessionAuth = require('./middleware/sessionAuth');

const app = express();
app.use(express.json());
console.log('API IS UP AND RUNNING');

// -------------------------
// Session middleware
// -------------------------
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // true in productie (HTTPS)
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 8, // 8 uur
    },
  })
);

// -------------------------
// Routes
// -------------------------
app.use('/auth', require('./routes/auth'));

// Publieke routes
app.use('/users', require('./routes/users'));
app.use('/categories', require('./routes/categories'));
app.use('/listings', require('./routes/listings'));
app.use('/search', require('./routes/search'));

// Routes met authenticatie
app.use('/bookings', sessionAuth, require('./routes/bookings'));
app.use('/favorites', sessionAuth, require('./routes/favorites'));
app.use('/notifications', sessionAuth, require('./routes/notifications'));
app.use('/sessions', sessionAuth, require('./routes/sessions'));
app.use('/search-logs', sessionAuth, require('./routes/searchLogs'));

// -------------------------
// Map route (Folium via Python-script)
// -------------------------
app.get('/map', (req, res) => {
  const scriptPath = path.join(__dirname, 'generate_map.py');

  // Pas 'python' aan naar 'python3' als dat bij jou nodig is
  execFile('python', [scriptPath], { cwd: __dirname }, (error, stdout, stderr) => {
    if (error) {
      console.error('Fout bij genereren map:', error);
      console.error('stderr:', stderr);
      return res.status(500).json({ error: 'Kon kaart niet genereren' });
    }

    console.log(stdout);

    const mapPath = path.join(__dirname, 'map.html');
    res.sendFile(mapPath);
  });
});

// -------------------------
// Start server
// -------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
