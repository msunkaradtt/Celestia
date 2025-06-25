// FILE: server/src/__tests__/api.test.ts

import request from 'supertest';
import app from '../app';


global.fetch = jest.fn(() =>
    Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
            title: 'Mock APOD Title',
            explanation: 'This is a mock explanation from a test.',
            url: 'https://example.com/mock-image.jpg',
        }),
    })   
) as jest.Mock;

describe('GET /api/space-data/apod', () => {
    it('should respond with a 200 OK status code', async () => {
        const response = await request(app).get('/api/space-data/apod');
        expect(response.statusCode).toBe(200);
    });

    it('should respond with a JSON object containing APOD data', async () => {
        const response = await request(app).get('/api/space-data/apod');
        expect(response.body).toHaveProperty('title', 'Mock APOD Title');
        expect(response.body).toHaveProperty('url');
    });
});