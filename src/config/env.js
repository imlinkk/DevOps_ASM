const dotenv = require('dotenv');

dotenv.config();

const cleanEnvVar = (val) => {
  if (!val) return val;
  let cleaned = val.trim();
  // Strip surrounding quotes
  cleaned = cleaned.replace(/^["']|["']$/g, '').trim();
  // Strip accidental key name prefix if pasted entirely into Render value field
  if (cleaned.startsWith('MONGODB_URI=')) {
    cleaned = cleaned.slice('MONGODB_URI='.length).trim().replace(/^["']|["']$/g, '').trim();
  }
  return cleaned;
};

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5000,
  MONGODB_URI: cleanEnvVar(process.env.MONGODB_URI) || 'mongodb://localhost:27017/product_db',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  APP_VERSION: process.env.npm_package_version || '1.0.0'
};
