// lib/prisma.js
const { PrismaClient } = require('@prisma/client');

let prisma;

// Prevent multiple instances in development (useful for hot reload)
if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

module.exports = prisma;
