const mongoose = require('mongoose');

// Use a dedicated test database (Docker MongoDB is already running on 27017)
const TEST_DB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/product_test_db';

beforeAll(async () => {
  await mongoose.connect(TEST_DB_URI);
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
  } catch (_err) {
    // ignore cleanup errors
  }
});
