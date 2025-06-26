// FILE: server/src/worker.ts
import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import axios from 'axios';
import FormData from 'form-data';
import { supabase } from './supabaseClient'; // Import the new Supabase client
import prisma from './db';
import { randomUUID } from 'crypto';
import { artGenerationQueue, broadcast } from './queue';

const redisHost = process.env.REDIS_HOST;
const redisPort = process.env.REDIS_PORT;
if (!redisHost || !redisPort) throw new Error('Redis config missing');
const connection = new IORedis({ host: redisHost, port: parseInt(redisPort), maxRetriesPerRequest: null });

const processJob = async (job: Job) => {
    const { prompt, negativePrompt, satelliteName, imageName, signatureImageBuffer } = job.data;
    console.log(`[Worker] Processing job ${job.id} for "${imageName}"...`);

    try {
        // 1. Call AI Service (no changes here)
        const aiServiceUrl = 'http://ai-service:8000/generate-art';
        const form = new FormData();
        form.append('image', Buffer.from(signatureImageBuffer.data), { filename: 'signature.png' });
        form.append('prompt', prompt);
        form.append('negative_prompt', negativePrompt);
        const aiResponse = await axios.post(aiServiceUrl, form, { headers: form.getHeaders(), responseType: 'arraybuffer' });
        const generatedImageBuffer = Buffer.from(aiResponse.data, 'binary');

        // --- UPDATED LOGIC: Upload to Supabase Storage ---
        const generatedImageName = `${randomUUID()}.png`;
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('artworks') // The name of your public bucket
            .upload(generatedImageName, generatedImageBuffer, {
                contentType: 'image/png',
                upsert: false,
            });

        if (uploadError) throw uploadError;

        // Get the public URL for the newly uploaded file
        const { data: urlData } = supabase.storage
            .from('artworks')
            .getPublicUrl(generatedImageName);
        const imageUrl = urlData.publicUrl;
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