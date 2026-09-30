const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const logger = require('./config/logger');
const { metricsMiddleware } = require('./middlewares/metricsMiddleware');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');

const productRoutes = require('./routes/productRoutes');
const healthRoutes = require('./routes/healthRoutes');
const metricsRoutes = require('./routes/metricsRoutes');

const app = express();

// Security HTTP headers
app.use(helmet());

// CORS configuration
app.use(cors());

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP request logger stream integrated with Winston
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(
  morgan(morganFormat, {
    stream: {
      write: (message) => logger.http(message.trim())
    },
    skip: (req) => req.url === '/health' || req.url === '/metrics'
  })
);

// Prometheus metrics middleware
app.use(metricsMiddleware);

// Welcome root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the DevOps Assignment REST API',
    endpoints: {
      products: '/api/v1/products',
      health: '/health',
      metrics: '/metrics'
    }
  });
});

// Mount API routes
app.use('/health', healthRoutes);
app.use('/metrics', metricsRoutes);
app.use('/api/v1/products', productRoutes);

// Catch 404
app.use(notFoundHandler);

// Central error handler
app.use(errorHandler);

module.exports = app;
