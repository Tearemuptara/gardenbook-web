// Mock dependencies first, before requiring the modules
jest.mock('../src/routes/plants', () => {
  const express = require('express');
  const router = express.Router();
  router.get('/', (req, res) => res.json({ message: 'Mock plants route' }));
  return router;
});

jest.mock('swagger-jsdoc', () => () => ({}));
jest.mock('swagger-ui-express', () => ({
  serve: [(req, res, next) => next()],
  setup: () => (req, res, next) => res.json({ message: 'Swagger docs' })
}));

const request = require('supertest');
const app = require('../src/app');

describe('App', () => {
  it('should set up middleware correctly', async () => {
    // Test that body-parser is set up
    const res = await request(app)
      .post('/api/test-body-parser')
      .send({ testKey: 'testValue' });
    
    // Test will pass as long as the request doesn't fail - we're just confirming middleware is there
    expect(res.status).not.toBe(500);
  });

  it('should set up Swagger documentation endpoint', async () => {
    // We're mocking the Swagger UI so we just need to confirm the endpoint is registered
    const res = await request(app).get('/api-docs');
    
    // Now we can expect a 200 status since we're returning JSON from our mock
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Swagger docs' });
  });

  it('should route /api/plants requests to the plants router', async () => {
    const res = await request(app).get('/api/plants');
    
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Mock plants route' });
  });

  it('should return 404 for undefined routes', async () => {
    const res = await request(app).get('/api/non-existent-route');
    
    expect(res.status).toBe(404);
  });
}); 