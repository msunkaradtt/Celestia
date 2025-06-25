// FILE: server/src/routes/tleData.ts
import { Router } from 'express';
import prisma from '../db'; // Import our Prisma client

const router = Router();

// This endpoint now reads directly from our database cache
router.get('/gnss', async (req, res) => {
  try {
    const satellites = await prisma.satellite.findMany({
      orderBy: {
        name: 'asc' // Keep the list consistent
      }
    });

    if (satellites.length === 0) {
      // This might happen on first startup before the cache is populated
      res.status(503).json({ error: 'Satellite data is currently being populated. Please try again in a moment.' });
      return;
    }

    res.status(200).json(satellites);
  } catch (error) {
    console.error('Failed to fetch satellites from database:', error);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
});

export default router;