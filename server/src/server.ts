// FILE: server/src/server.ts
import app from './app';
import { createServer } from 'http';
import { setupMinio } from './minioClient';
import { startTleScheduler } from './jobs/tleScheduler';
import { initWebSocketServer } from './queue';
import { startWorker } from './worker';

const port = process.env.PORT || 3001;

// Create the main HTTP server from our Express application
const httpServer = createServer(app);

// Initialize the WebSocket Server and attach it to the HTTP server
initWebSocketServer(httpServer);

// --- NEW: Function to wait for the AI service ---
async function waitForAiService() {
    const aiServiceUrl = 'http://ai-service:8000/health';
    let isReady = false;
    console.log('Checking AI service readiness...');
    while (!isReady) {
        try {
            const response = await fetch(aiServiceUrl);
            if (response.status === 200) {
                isReady = true;
                console.log('✅ AI service is ready.');
            } else {
                throw new Error(`Status: ${response.status}`);
            }
        } catch (error) {
            console.log('AI service not ready, waiting 5 seconds to retry...');
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s before retrying
        }
    }
}

async function startBackgroundServices() {
    console.log('Starting background services...');
    //await setupMinio();
    await waitForAiService();
    startTleScheduler();
    startWorker();
    console.log('✅ Background services started.');
}

// Start the server, and only then start the background services
httpServer.listen(port, () => {
    console.log(`✅ Server and WebSocket are running on http://localhost:${port}`);
    startBackgroundServices().catch(err => {
        console.error("Fatal error during background service startup:", err);
        process.exit(1);
    });
});