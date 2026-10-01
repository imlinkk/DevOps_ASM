const mongoose = require('mongoose');

const TEST_DB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/product_test_db';

beforeAll(async () => {
  try {
    await mongoose.connect(TEST_DB_URI, {
      family: 4,
      directConnection: true,
      serverSelectionTimeoutMS: 10000
    });
  } catch (error) {
    throw new Error(`Test MongoDB connection failed: ${error.message}`, { cause: error });
  }
});

afterEach(async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
});

afterAll(async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
    }
  } catch {
    // ignore cleanup errors
  }
});
