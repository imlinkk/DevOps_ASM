const dotenv = require('dotenv');

dotenv.config();

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/product_db',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  APP_VERSION: process.env.npm_package_version || '1.0.0'
};
