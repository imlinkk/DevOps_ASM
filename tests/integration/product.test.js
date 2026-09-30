const request = require('supertest');
const app = require('../../src/app');
require('../setup');

describe('Product CRUD API Endpoints', () => {
  const sampleProduct = {
    name: 'Logitech MX Master 3S',
    description: 'Ergonomic wireless mouse with ultra-fast scrolling',
    price: 99.99,
    category: 'Electronics',
    stock: 50
  };

  describe('POST /api/v1/products', () => {
    it('should create a new product successfully', async () => {
      const res = await request(app)
        .post('/api/v1/products')
        .send(sampleProduct);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('_id');
      expect(res.body.data.name).toBe(sampleProduct.name);
      expect(res.body.data.price).toBe(sampleProduct.price);
      expect(res.body.data.inStock).toBe(true);
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/v1/products')
        .send({
          name: 'Incomplete Item'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation failed');
    });

    it('should return 400 when price is negative', async () => {
      const res = await request(app)
        .post('/api/v1/products')
        .send({
          ...sampleProduct,
          price: -10
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/products', () => {
    beforeEach(async () => {
      await request(app).post('/api/v1/products').send({
        name: 'Keyboard Mechanical K3',
        description: 'Wireless mechanical keyboard',
        price: 85.0,
        category: 'Electronics',
        stock: 20
      });

      await request(app).post('/api/v1/products').send({
        name: 'Clean Code Book',
        description: 'A handbook of agile software craftsmanship',
        price: 35.0,
        category: 'Books',
        stock: 100
      });
    });

    it('should retrieve all products with pagination info', async () => {
      const res = await request(app).get('/api/v1/products');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
      expect(res.body.total).toBe(2);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should filter products by category', async () => {
      const res = await request(app).get('/api/v1/products?category=Books');

      expect(res.statusCode).toBe(200);
      expect(res.body.count).toBe(1);
      expect(res.body.data[0].category).toBe('Books');
      expect(res.body.data[0].name).toBe('Clean Code Book');
    });

    it('should search products by name regex query', async () => {
      const res = await request(app).get('/api/v1/products?search=keyboard');

      expect(res.statusCode).toBe(200);
      expect(res.body.count).toBe(1);
      expect(res.body.data[0].name).toContain('Keyboard');
    });
  });

  describe('GET /api/v1/products/:id', () => {
    it('should retrieve a single product by valid ID', async () => {
      const createRes = await request(app)
        .post('/api/v1/products')
        .send(sampleProduct);

      const productId = createRes.body.data._id;

      const res = await request(app).get(`/api/v1/products/${productId}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(productId);
      expect(res.body.data.name).toBe(sampleProduct.name);
    });

    it('should return 404 when product ID does not exist', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';
      const res = await request(app).get(`/api/v1/products/${nonExistentId}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for malformed ObjectId', async () => {
      const res = await request(app).get('/api/v1/products/invalid-id-format');

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid format');
    });
  });

  describe('PUT /api/v1/products/:id', () => {
    it('should update an existing product', async () => {
      const createRes = await request(app)
        .post('/api/v1/products')
        .send(sampleProduct);

      const productId = createRes.body.data._id;

      const res = await request(app)
        .put(`/api/v1/products/${productId}`)
        .send({
          price: 79.99,
          stock: 0
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.price).toBe(79.99);
      expect(res.body.data.stock).toBe(0);
      expect(res.body.data.inStock).toBe(false);
    });

    it('should return 404 when updating non-existent product', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .put(`/api/v1/products/${nonExistentId}`)
        .send({ price: 100 });

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/products/:id', () => {
    it('should delete a product by ID', async () => {
      const createRes = await request(app)
        .post('/api/v1/products')
        .send(sampleProduct);

      const productId = createRes.body.data._id;

      const deleteRes = await request(app).delete(`/api/v1/products/${productId}`);
      expect(deleteRes.statusCode).toBe(200);
      expect(deleteRes.body.success).toBe(true);
      expect(deleteRes.body.message).toContain('deleted successfully');

      // Verify it is gone
      const getRes = await request(app).get(`/api/v1/products/${productId}`);
      expect(getRes.statusCode).toBe(404);
    });

    it('should return 404 when deleting non-existent product', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';
      const res = await request(app).delete(`/api/v1/products/${nonExistentId}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
