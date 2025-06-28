// FILE: server/src/worker.ts
import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import axios from 'axios';
import FormData from 'form-data';
import { s3Client, BUCKET_NAME } from './supabaseClient'; // We'll keep this filename for simplicity
import { PutObjectCommand } from "@aws-sdk/client-s3";
import prisma from './db';
import { randomUUID } from 'crypto';
import { artGenerationQueue, broadcast } from './queue';
import { EC2Client, RunInstancesCommand, DescribeInstancesCommand } from "@aws-sdk/client-ec2";

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = process.env.REDIS_PORT || '6379';
const connection = new IORedis({ host: redisHost, port: parseInt(redisPort), maxRetriesPerRequest: null });

const region = process.env.AWS_REGION || "us-east-1";
const ec2Client = new EC2Client({ region });
const AI_INSTANCE_LAUNCH_TEMPLATE = process.env.AI_INSTANCE_LAUNCH_TEMPLATE || '';
let aiServiceUrl = process.env.AI_SERVICE_URL || '';

// --- NEW --- Function to manage the AI instance
async function ensureAiServiceIsRunning(): Promise<string> {
    const params = {
        Filters: [
            { Name: 'tag:Name', Values: ['celestia-ai-worker'] },
            { Name: 'instance-state-name', Values: ['running', 'pending'] }
        ]
    };

    const { Reservations } = await ec2Client.send(new DescribeInstancesCommand(params));
    const runningInstance = Reservations?.flatMap(r => r.Instances ?? []).find(i => i);

    if (runningInstance && runningInstance.PublicIpAddress) {
        console.log(`[Worker] AI instance is already running at ${runningInstance.PublicIpAddress}`);
        return `http://${runningInstance.PublicIpAddress}:8000`;
    }

    console.log('[Worker] No running AI instance found. Launching a new one...');
    const launchParams = {
        LaunchTemplate: {
            LaunchTemplateName: AI_INSTANCE_LAUNCH_TEMPLATE,
            Version: '$Latest'
        },
        MaxCount: 1,
        MinCount: 1,
        TagSpecifications: [{
            ResourceType: 'instance',
            Tags: [{ Key: 'Name', Value: 'celestia-ai-worker' }]
        }]
    };

    const { Instances } = await ec2Client.send(new RunInstancesCommand(launchParams));
    const newInstance = Instances?.[0];
    if (!newInstance || !newInstance.InstanceId) {
        throw new Error('Failed to launch EC2 instance.');
    }

    console.log(`[Worker] Launched new AI instance: ${newInstance.InstanceId}. Waiting for it to be ready...`);

    // Wait for the instance to get a public IP and be ready
    let publicIp: string | undefined;
    while (!publicIp) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // wait 10 seconds
        const data = await ec2Client.send(new DescribeInstancesCommand({ InstanceIds: [newInstance.InstanceId] }));
        publicIp = data.Reservations?.[0]?.Instances?.[0]?.PublicIpAddress;
    }

    const healthCheckUrl = `http://${publicIp}:8000/health`;
    let isReady = false;
    while (!isReady) {
        try {
            const response = await axios.get(healthCheckUrl, { timeout: 2000 });
            if (response.status === 200) {
                isReady = true;
                console.log(`[Worker] AI service is ready at ${publicIp}`);
            }
        } catch (error) {
            console.log('[Worker] AI service not ready yet, waiting 10 seconds...');
            await new Promise(resolve => setTimeout(resolve, 10000));
        }
    }
    
    return `http://${publicIp}:8000`;
}


const processJob = async (job: Job) => {
    const { prompt, negativePrompt, satelliteName, imageName, signatureImageBuffer } = job.data;
    console.log(`[Worker] Processing job ${job.id} for "${imageName}"...`);

    try {
        // 1. Ensure AI service is running and get its URL
        aiServiceUrl = await ensureAiServiceIsRunning();

        // 2. Call AI Service
        const aiServiceUrlGenerate = `${aiServiceUrl}/generate-art`;
        const form = new FormData();
        form.append('image', Buffer.from(signatureImageBuffer.data), { filename: 'signature.png' });
        form.append('prompt', prompt);
        form.append('negative_prompt', negativePrompt);
        const aiResponse = await axios.post(aiServiceUrlGenerate, form, { headers: form.getHeaders(), responseType: 'arraybuffer' });
        const generatedImageBuffer = Buffer.from(aiResponse.data, 'binary');

        // 3. Upload to AWS S3
        const generatedImageName = `${randomUUID()}.png`;
        const s3Params = {
            Bucket: BUCKET_NAME,
            Key: generatedImageName,
            Body: generatedImageBuffer,
            ContentType: 'image/png',
            ACL: 'public-read' // Make the object publicly accessible
        };
        await s3Client.send(new PutObjectCommand(s3Params));
        
        const imageUrl = `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${generatedImageName}`;
        
        // 4. Save metadata to our PostgreSQL database
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
        concurrency: 1 // Process one job at a time
    });

    worker.on('active', job => { console.log(`[Worker] Job ${job.id} is now active.`); broadcastQueueUpdate(); });
    worker.on('completed', job => { console.log(`[Worker] Job ${job.id} has completed.`); broadcastQueueUpdate(); });
    worker.on('failed', (job, err) => { console.error(`[Worker] Job ${job?.id} failed: ${err.message}`); broadcastQueueUpdate(); });
}