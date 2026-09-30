const request = require('supertest');
const app = require('../../src/app');
require('../setup');

describe('Health and System Endpoints', () => {
  describe('GET /', () => {
    it('should return welcome message and endpoint index', async () => {
      const res = await request(app).get('/');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.endpoints).toHaveProperty('products');
      expect(res.body.endpoints).toHaveProperty('health');
      expect(res.body.endpoints).toHaveProperty('metrics');
    });
  });

  describe('GET /health', () => {
    it('should return 200 and healthy status when database is connected', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('OK');
      expect(res.body.database.healthy).toBe(true);
      expect(res.body.database.status).toBe('connected');
      expect(res.body).toHaveProperty('uptime');
      expect(res.body).toHaveProperty('version');
      expect(res.body).toHaveProperty('system');
    });
  });

  describe('GET /health/live', () => {
    it('should return 200 with status ALIVE', async () => {
      const res = await request(app).get('/health/live');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('ALIVE');
    });
  });

  describe('GET /health/ready', () => {
    it('should return 200 with status READY when DB is connected', async () => {
      const res = await request(app).get('/health/ready');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('READY');
    });
  });

  describe('GET /metrics', () => {
    it('should return Prometheus metrics format', async () => {
      const res = await request(app).get('/metrics');
      expect(res.statusCode).toBe(200);
      expect(res.text).toContain('devops_app_');
      expect(res.text).toContain('http_requests_total');
    });
  });

  describe('GET /non-existent-route', () => {
    it('should return 404 for unknown endpoints', async () => {
      const res = await request(app).get('/api/v1/unknown');
      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Resource not found');
    });
  });
});
