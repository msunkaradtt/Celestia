// FILE: server/src/__tests__/tle.test.ts

import request from 'supertest';
import app from '../app';

// Mock the network request to CelesTrak
const mockTleData = `
GPS BIIR-1  (PRN 13)
1 26407U 00040A   24172.50000000  .00000000  00000-0  00000+0 0  9990
2 26407  55.0000 180.0000 0010000 180.0000 180.0000  2.0000000012345
BEIDOU-3 M22
1 51049U 22001A   24172.50000000  .00000000  00000-0  00000+0 0  9991
2 51049  55.0000 180.0000 0010000 180.0000 180.0000  2.0000000012345
`;

global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      text: () => Promise.resolve(mockTleData),
    })
) as jest.Mock;

describe('GET /api/tle-data/gnss', () => {
    it('should respond with a 200 OK status code', async () => {
        const response = await request(app).get('/api/tle-data/gnss');
        expect(response.statusCode).toBe(200);
    });

    it('should respond with a JSON array', async () => {
        const response = await request(app).get('/api/tle-data/gnss');
        expect(response.body).toBeInstanceOf(Array);
    });

    it('should return parsed TLE data with name, line1, and line2 properties', async () => {
        const response = await request(app).get('/api/tle-data/gnss');
        expect(response.body.length).toBeGreaterThan(0);

        const firstSat = response.body[0];
        expect(firstSat).toHaveProperty('name', 'GPS BIIR-1  (PRN 13)');
        expect(firstSat).toHaveProperty('line1');
        expect(firstSat).toHaveProperty('line2');
    });
});