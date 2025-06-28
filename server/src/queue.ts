// FILE: server/src/queue.ts
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { WebSocketServer, WebSocket } from 'ws';
import { Server as HttpServer } from 'http'; // Use an alias for clarity

// This import is needed for the broadcast function
import { broadcastQueueUpdate } from './worker'; 

const redisHost = process.env.REDIS_HOST;
const redisPort = process.env.REDIS_PORT;

if (!redisHost || !redisPort) {
    throw new Error('FATAL ERROR: REDIS_HOST and REDIS_PORT must be defined.');
}

console.log(`[Worker Redis] Attempting to connect to: ${redisHost}:${redisPort}`);

// Updated connection to handle ElastiCache
const connection = new IORedis(`rediss://:${redisHost}:${redisPort}`, {
  tls: {
    rejectUnauthorized: false
  },
  maxRetriesPerRequest: null
});

connection.on('connect', () => console.log('[Redis] Connected successfully.'));
connection.on('error', err => console.error('[Redis Connection Error]', err));

export const artGenerationQueue = new Queue('art-generation-queue', { connection: connection.duplicate() });

let wss: WebSocketServer;

export function initWebSocketServer(httpServer: HttpServer) {
    wss = new WebSocketServer({ server: httpServer });
    console.log('✅ WebSocket Server initialized and attached to HTTP server.');

    wss.on('connection', ws => {
        console.log('Client connected to WebSocket');
        
        // Immediately send the current queue status to the new client
        broadcastQueueUpdate().catch(console.error);

        ws.on('close', () => console.log('Client disconnected'));
    });
}

export function broadcast(message: object) {
    if (!wss) return;
    const data = JSON.stringify(message);
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
}