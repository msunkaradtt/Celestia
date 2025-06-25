// FILE: server/src/jobs/tleScheduler.ts
import { updateTleData } from '../services/tleService';

const ONE_HOUR_IN_MS = 60 * 60 * 1000;

export function startTleScheduler() {
    console.log('Starting TLE scheduler...');

    // Run once immediately on startup to ensure data is available
    updateTleData();

    // Then, run every hour
    setInterval(updateTleData, ONE_HOUR_IN_MS);
}