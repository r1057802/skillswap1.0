// server.js
// -------------------------
// Import packages
// -------------------------
const express = require('express');
const session = require('express-session');
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

// Routes met authenticatie
app.use('/bookings', sessionAuth, require('./routes/bookings'));
app.use('/favorites', sessionAuth, require('./routes/favorites'));
app.use('/notifications', sessionAuth, require('./routes/notifications'));
app.use('/sessions', sessionAuth, require('./routes/sessions'));
app.use('/search-logs', sessionAuth, require('./routes/searchLogs'));

// -------------------------
// Start server
// -------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
