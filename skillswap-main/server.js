// server.js
// -------------------------
// Import packages
// -------------------------
const express = require('express');
const session = require('express-session');
const path = require('path');
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
      secure: process.env.NODE_ENV === 'production', // true in productie (HTTPS)
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 8, // 8 uur
    },
  })
);

// -------------------------
// Routes
// -------------------------
app.use('/auth', require('./routes/auth'));
app.use('/upload', require('./routes/upload'));

// Publieke routes
app.use('/users', require('./routes/users'));
app.use('/categories', require('./routes/categories'));
app.use('/listings', require('./routes/listings'));
app.use('/search', require('./routes/search'));
app.use('/map', require('./routes/map'));

// Routes met authenticatie
app.use('/bookings', sessionAuth, require('./routes/bookings'));
app.use('/favorites', sessionAuth, require('./routes/favorites'));
app.use('/notifications', sessionAuth, require('./routes/notifications'));
app.use('/sessions', sessionAuth, require('./routes/sessions'));
app.use('/search-logs', sessionAuth, require('./routes/searchLogs'));  // BESTAANDE SEARCH-LOG ROUTE

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// -------------------------
// Start server
// -------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});

// -------------------------
// Error handler
// -------------------------
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});
