// FILE: server/src/__tests__/art.test.ts

import request from 'supertest';
import app from '../app';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('POST /api/art/generate', () => {
    it('should proxy the image to the AI service and return its response', async () => {
        const aiServiceResponse = {
            message: 'Success from mock',
            generated_art_url: 'http://example.com/mock-art.png',
        };

        mockedAxios.post.mockResolvedValue({ status: 200, data: aiServiceResponse });

        const response = await request(app)
        .post('/api/art/generate')
        .attach('image', Buffer.from('fake image data'), 'test-image.png');

        expect(response.status).toBe(200);

        expect(mockedAxios.post).toHaveBeenCalled();

        expect(response.body).toEqual(aiServiceResponse);
    });
});