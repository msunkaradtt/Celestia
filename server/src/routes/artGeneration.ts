// FILE: server/src/routes/artGeneration.ts
import { Router } from 'express';
import multer from 'multer';
import prisma from '../db';
import { artGenerationQueue } from '../queue';
import { broadcastQueueUpdate } from '../worker';

const router = Router();
// --- THE FIX: Use upload.any() ---
// This tells multer to accept any files and all text fields,
// which is much more robust than upload.single().
const upload = multer({ storage: multer.memoryStorage() });

router.post('/generate', upload.any(), async (req, res) => {
    const imageFile = (req.files as Express.Multer.File[])?.find(f => f.fieldname === 'image');
    if (!imageFile) {
        res.status(400).json({ error: 'No image file provided.' });
        return;
    }

    const { prompt, negativePrompt, satelliteName, imageName } = req.body;
    if (!prompt || !negativePrompt || !satelliteName || !imageName) {
        res.status(400).json({ error: 'Missing required fields.' })
        return;
    }

    try {
        // Add job to the queue
        const job = await artGenerationQueue.add('generate-art', {
            prompt,
            negativePrompt,
            satelliteName,
            imageName,
            // Pass the buffer as part of the job data
            signatureImageBuffer: imageFile.buffer
        });

        // Notify all clients that the queue has changed
        await broadcastQueueUpdate();

        // Respond immediately to the user
        res.status(202).json({ message: 'Request accepted and queued for processing.', jobId: job.id });

    } catch (error) {
        console.error('Failed to add job to queue:', error);
        res.status(500).json({ error: 'Could not queue request.' });
    }
});


// The GET /gallery route remains unchanged
router.get('/gallery', async (req, res) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 9;
        const satelliteName = req.query.satelliteName as string | undefined;
        const skip = (page - 1) * limit;
        const whereClause = satelliteName ? { satelliteName: satelliteName } : {};

        const [totalArtworks, artworks] = await prisma.$transaction([
            prisma.artwork.count({ where: whereClause }),
            prisma.artwork.findMany({
                where: whereClause,
                skip: skip,
                take: limit,
                orderBy: { createdAt: 'desc' }
            })
        ]);

        const totalPages = Math.ceil(totalArtworks / limit);

        res.status(200).json({
            artworks,
            currentPage: page,
            totalPages: totalPages,
            totalArtworks: totalArtworks,
        });
    } catch (error) {
        console.error('Error fetching gallery:', error);
        res.status(500).json({ error: 'Failed to fetch gallery.' });
    }
});

export default router;