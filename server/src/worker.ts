// FILE: server/src/worker.ts
import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import axios from 'axios';
import FormData from 'form-data';
// Assuming you have a supabaseClient.ts file that exports the s3Client and BUCKET_NAME
// If not, you may need to create it to initialize your S3 client.
import { s3Client, BUCKET_NAME } from './supabaseClient';
import { PutObjectCommand } from "@aws-sdk/client-s3";
import prisma from './db';
import { randomUUID } from 'crypto';
import { artGenerationQueue, broadcast } from './queue';

const redisHost = process.env.REDIS_HOST;
const redisPort = process.env.REDIS_PORT;
const runpodApiKey = process.env.RUNPOD_API_KEY;
const runpodEndpointId = process.env.RUNPOD_ENDPOINT_ID;
const region = process.env.AWS_REGION || "us-east-1";

if (!redisHost || !redisPort) {
    throw new Error('Redis config missing');
}
if (!runpodApiKey || !runpodEndpointId) {
    throw new Error('RunPod API Key and Endpoint ID must be defined');
}

// --- THE FIX: Add enableReadyCheck to the connection options ---
// This makes the connection more robust and prevents the READONLY error after idle periods.
const connection = new IORedis({
    host: redisHost,
    port: parseInt(redisPort),
    maxRetriesPerRequest: null,
    enableReadyCheck: true
});

const processJob = async (job: Job) => {
    const { prompt, negativePrompt, satelliteName, imageName, signatureImageBuffer } = job.data;
    console.log(`[Worker] Processing job ${job.id} via RunPod...`);

    try {
        const imageBase64 = Buffer.from(signatureImageBuffer.data).toString('base64');
        const runpodUrl = `https://api.runpod.ai/v2/${runpodEndpointId}/runsync`;
        
        const response = await axios.post(runpodUrl, {
            input: {
                prompt,
                negative_prompt: negativePrompt,
                image: imageBase64,
            }
        }, {
            headers: { 'Authorization': `Bearer ${runpodApiKey}` }
        });

        if (response.data.status !== 'COMPLETED') {
            throw new Error(`RunPod job failed: ${JSON.stringify(response.data)}`);
        }

        const generatedImageBuffer = Buffer.from(response.data.output.image_base64, 'base64');
        const generatedImageName = `${randomUUID()}.png`;
        
        await s3Client.send(new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: generatedImageName,
            Body: generatedImageBuffer,
            ContentType: 'image/png',
            ACL: 'public-read' // Add this if you want images to be publicly viewable
        }));
        
        const imageUrl = `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${generatedImageName}`;
        
        const newArtwork = await prisma.artwork.create({
            data: { name: imageName, prompt, negativePrompt, satelliteName, imageUrl }
        });

        console.log(`[Worker] Job ${job.id} completed successfully.`);
        broadcast({ type: 'artwork_completed', artwork: newArtwork });

    } catch (error) {
        let errorMessage = 'An unknown error occurred';
        if (axios.isAxiosError(error)) {
            errorMessage = JSON.stringify(error.response?.data) || error.message;
        } else if (error instanceof Error) {
            errorMessage = error.message;
        }
        console.error(`[Worker] Job ${job.id} failed:`, errorMessage);
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
        concurrency: 5 
    });

    worker.on('active', job => { console.log(`[Worker] Job ${job.id} is now active.`); broadcastQueueUpdate(); });
    worker.on('completed', job => { console.log(`[Worker] Job ${job.id} has completed.`); broadcastQueueUpdate(); });
    worker.on('failed', (job, err) => { console.error(`[Worker] Job ${job?.id} failed: ${err.message}`); broadcastQueueUpdate(); });
}