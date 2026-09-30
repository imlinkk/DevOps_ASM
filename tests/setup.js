const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

jest.setTimeout(120000);

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  // directConnection required for mongodb-memory-server compatibility
  await mongoose.connect(uri, {
    directConnection: true,
    serverSelectionTimeoutMS: 30000
  });
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
  if (mongoServer) {
    await mongoServer.stop({ doCleanup: true });
  }
});
