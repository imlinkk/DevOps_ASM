const express = require('express');
const mongoose = require('mongoose');
const { APP_VERSION, NODE_ENV } = require('../config/env');

const router = express.Router();

router.get('/', (req, res) => {
  const dbStatusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  const dbState = mongoose.connection.readyState;
  const isDbHealthy = dbState === 1;

  const healthData = {
    status: isDbHealthy ? 'OK' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: NODE_ENV,
    version: APP_VERSION,
    database: {
      status: dbStatusMap[dbState] || 'unknown',
      healthy: isDbHealthy
    },
    system: {
      memory: {
        rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`
      }
    }
  };

  const statusCode = isDbHealthy ? 200 : 503;
  res.status(statusCode).json(healthData);
});

// Liveness probe (just checks if express process is alive)
router.get('/live', (req, res) => {
  res.status(200).json({ status: 'ALIVE' });
});

// Readiness probe (checks if DB is ready to serve traffic)
router.get('/ready', (req, res) => {
  const isDbHealthy = mongoose.connection.readyState === 1;
  if (isDbHealthy) {
    return res.status(200).json({ status: 'READY' });
  }
  return res.status(503).json({ status: 'NOT_READY' });
});

module.exports = router;
