// FILE: server/src/routes/spaceData.ts
import { Router } from 'express';

const router = Router();

router.get('/apod', async (require, res) => {
    try {
        const apiKey = process.env.NASA_API_KEY;
        const nasaUrl = `https://api.nasa.gov/planetary/apod?api_key=${apiKey}`;
        const response = await fetch(nasaUrl);

        if (!response.ok) {
            throw new Error('Failed to fetch data from NASA');
        }

        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An internal server error occurred.' });
    }
});

export default router;