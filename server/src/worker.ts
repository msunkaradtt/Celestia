// FILE: server/src/worker.ts
import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import axios from 'axios';
import FormData from 'form-data';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"; // AWS S3 Client
import prisma from './db';
import { randomUUID } from 'crypto';
import { artGenerationQueue, broadcast } from './queue';

// Initialize S3 Client
const s3Client = new S3Client({ region: process.env.AWS_REGION });
const BUCKET_NAME = process.env.S3_BUCKET_NAME;

const redisHost = process.env.REDIS_HOST;
const redisPort = process.env.REDIS_PORT;
const aiserviceURL = process.env.AI_SERVICE_URL;

if (!redisHost || !redisPort) throw new Error('Redis config missing');
const connection = new IORedis({ host: redisHost, port: parseInt(redisPort), maxRetriesPerRequest: null });

const processJob = async (job: Job) => {
    const { prompt, negativePrompt, satelliteName, imageName, signatureImageBuffer } = job.data;
    console.log(`[Worker] Processing job ${job.id} for "${imageName}"...`);

    try {
        // 1. Call AI Service (no changes here)
        if (!aiserviceURL) throw new Error("AI_SERVICE_URL not configured");
        const aiServiceUrl = `${aiserviceURL}/generate-art`;
        const form = new FormData();
        form.append('image', Buffer.from(signatureImageBuffer.data), { filename: 'signature.png' });
        form.append('prompt', prompt);
        form.append('negative_prompt', negativePrompt);
        const aiResponse = await axios.post(aiServiceUrl, form, { headers: form.getHeaders(), responseType: 'arraybuffer' });
        const generatedImageBuffer = Buffer.from(aiResponse.data, 'binary');

        // --- UPDATED LOGIC: Upload to AWS S3 ---
        if (!BUCKET_NAME || !process.env.AWS_REGION) {
            throw new Error("S3 Bucket Name or AWS Region is not configured.");
        }
        const generatedImageName = `${randomUUID()}.png`;
        const uploadCommand = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: generatedImageName,
            Body: generatedImageBuffer,
            ContentType: 'image/png',
            ACL: 'public-read' // Make the file publicly viewable
        });
        await s3Client.send(uploadCommand);
        const imageUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${generatedImageName}`;
        // --- END UPDATED LOGIC ---

        // 3. Save metadata to our PostgreSQL database (no changes here)
        const newArtwork = await prisma.artwork.create({
            data: { name: imageName, prompt, negativePrompt, satelliteName, imageUrl }
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
    broadcast({ type: 'queue_update', waiting: counts.wait, active: counts.active });
}

export function startWorker() {
    console.log('Starting Art Generation Worker...');
    const worker = new Worker('art-generation-queue', processJob, { 
        connection: connection.duplicate(),
        concurrency: 1
    });
    worker.on('active', job => { console.log(`[Worker] Job ${job.id} is now active.`); broadcastQueueUpdate(); });
    worker.on('completed', job => { console.log(`[Worker] Job ${job.id} has completed.`); broadcastQueueUpdate(); });
    worker.on('failed', (job, err) => { console.error(`[Worker] Job ${job?.id} failed: ${err.message}`); broadcastQueueUpdate(); });
}