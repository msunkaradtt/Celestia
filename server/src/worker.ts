// FILE: server/src/worker.ts
import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import axios from 'axios';
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

const connection = new IORedis({ host: redisHost, port: parseInt(redisPort), maxRetriesPerRequest: null });

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
        }));
        
        const imageUrl = `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${generatedImageName}`;
        
        const newArtwork = await prisma.artwork.create({
            data: { name: imageName, prompt, negativePrompt, satelliteName, imageUrl }
        });

        console.log(`[Worker] Job ${job.id} completed successfully.`);
        broadcast({ type: 'artwork_completed', artwork: newArtwork });

    } catch (error) {
        // --- THIS IS THE FIX ---
        let errorMessage = 'An unknown error occurred';
        if (axios.isAxiosError(error)) {
            // This checks if it's an error from an API call
            errorMessage = JSON.stringify(error.response?.data) || error.message;
        } else if (error instanceof Error) {
            // This checks if it's a standard JavaScript Error
            errorMessage = error.message;
        }
        console.error(`[Worker] Job ${job.id} failed:`, errorMessage);
        // We re-throw the original error to let BullMQ handle the job failure
        throw error;
        // --- END FIX ---
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