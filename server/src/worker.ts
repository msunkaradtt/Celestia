// FILE: server/src/worker.ts
import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import axios from 'axios';
import FormData from 'form-data';
import { minioClient, BUCKET_NAME } from './minioClient';
import prisma from './db';
import { randomUUID } from 'crypto';
import { artGenerationQueue, broadcast } from './queue';

const redisHost = "redis";
const redisPort = "6379";

if (!redisHost || !redisPort) {
    throw new Error('FATAL ERROR: REDIS_HOST and REDIS_PORT must be defined in the environment variables for the worker.');
}

const connection = new IORedis({
  host: redisHost,
  port: parseInt(redisPort),
  maxRetriesPerRequest: null
});

connection.on('connect', () => console.log('[Worker Redis] Connected successfully.'));
connection.on('error', err => console.error('[Worker Redis Connection Error]', err));


const processJob = async (job: Job) => {
    const { prompt, negativePrompt, satelliteName, imageName, signatureImageBuffer } = job.data;
    console.log(`[Worker] Processing job ${job.id} for "${imageName}"...`);

    try {
        const aiServiceUrl = 'http://ai-service:8000/generate-art';
        const form = new FormData();
        form.append('image', Buffer.from(signatureImageBuffer.data), { filename: 'signature.png' });
        form.append('prompt', prompt);
        form.append('negative_prompt', negativePrompt);
        
        const aiResponse = await axios.post(aiServiceUrl, form, {
            headers: form.getHeaders(),
            responseType: 'arraybuffer'
        });

        const generatedImageBuffer = Buffer.from(aiResponse.data, 'binary');
        const generatedImageName = `${randomUUID()}.png`;

        // --- THE FIX: Arguments are now in the correct order ---
        // The signature is: putObject(bucketName, objectName, stream, size, metaData)
        const metaData = { 'Content-Type': 'image/png' };
        await minioClient.putObject(
            BUCKET_NAME,
            generatedImageName,
            generatedImageBuffer,
            generatedImageBuffer.length, // Pass the buffer size here
            metaData                    // Pass the metadata here
        );
        // --- END FIX ---
        
        const imageUrl = `http://localhost:9000/${BUCKET_NAME}/${generatedImageName}`;
        
        const newArtwork = await prisma.artwork.create({
            data: {
                name: imageName,
                prompt,
                negativePrompt,
                satelliteName,
                imageUrl
            }
        });

        console.log(`[Worker] Job ${job.id} completed successfully.`);
        broadcast({ type: 'artwork_completed', artwork: newArtwork });

    } catch (error) {
        console.error(`[Worker] Job ${job.id} failed.`, error);
        throw error;
    }
};

export async function broadcastQueueUpdate() {
    const counts = await artGenerationQueue.getJobCounts('wait', 'active');
    broadcast({
        type: 'queue_update',
        waiting: counts.wait,
        active: counts.active
    });
}

export function startWorker() {
    console.log('Starting Art Generation Worker...');
    const worker = new Worker('art-generation-queue', processJob, { 
        connection: connection.duplicate(),
        concurrency: 1
    });

    worker.on('active', job => {
        console.log(`[Worker] Job ${job.id} is now active.`);
        broadcastQueueUpdate();
    });

    worker.on('completed', job => {
        console.log(`[Worker] Job ${job.id} has completed.`);
        broadcastQueueUpdate();
    });

    worker.on('failed', (job, err) => {
        console.error(`[Worker] Job ${job?.id} failed with error ${err.message}`);
        broadcastQueueUpdate();
    });
}