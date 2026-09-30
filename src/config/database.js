const mongoose = require('mongoose');
const { MONGODB_URI } = require('./env');
const logger = require('./logger');

const connectDB = async (uri = MONGODB_URI) => {
  try {
    const conn = await mongoose.connect(uri);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    logger.error(`MongoDB Connection Error: ${error.message}`);
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
    throw error;
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB Connection Closed');
  } catch (error) {
    logger.error(`Error closing MongoDB: ${error.message}`);
  }
};

module.exports = { connectDB, disconnectDB };
