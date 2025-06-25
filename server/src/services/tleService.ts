// FILE: server/src/services/tleService.ts
import prisma from '../db';
import crypto from 'crypto';

interface TleRecord {
  name: string;
  line1: string;
  line2: string;
}

const CELESTRAK_URL = 'https://celestrak.org/NORAD/elements/gnss.txt';

// Parses the raw 3-line text into a structured array
function parseTleData(tleText: string): TleRecord[] {
  const lines = tleText.trim().split(/\r?\n/);
  const satellites: TleRecord[] = [];
  for (let i = 0; i < lines.length; i += 3) {
    if (lines[i] && lines[i + 1] && lines[i + 2]) {
      satellites.push({
        name: lines[i].trim(),
        line1: lines[i + 1].trim(),
        line2: lines[i + 2].trim(),
      });
    }
  }
  return satellites;
}

// Creates a hash of the TLE data to easily check if it has changed
function hashData(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
}

// The main function to update our database
export async function updateTleData() {
  console.log('Checking for TLE data updates...');
  try {
    // 1. Fetch the latest data from CelesTrak
    const response = await fetch(CELESTRAK_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch from CelesTrak, status: ${response.status}`);
    }
    const latestTleText = await response.text();
    const latestTleHash = hashData(latestTleText);

    // 2. Compare with a stored hash (or just check if DB is empty)
    const currentSatellites = await prisma.satellite.findMany();
    if (currentSatellites.length === 0) {
        console.log('Database is empty. Performing initial population.');
    } else {
        const currentTleText = currentSatellites.map(s => `${s.name}\n${s.line1}\n${s.line2}`).join('\n');
        const currentTleHash = hashData(currentTleText);

        if (latestTleHash === currentTleHash) {
            console.log('TLE data is already up-to-date.');
            return;
        }
        console.log('New TLE data detected. Updating database...');
    }

    // 3. If data is new, update the database
    const newSatellites = parseTleData(latestTleText);

    // Use a transaction to delete all old data and insert all new data
    await prisma.$transaction([
        prisma.satellite.deleteMany(),
        prisma.satellite.createMany({
            data: newSatellites,
            skipDuplicates: true, // Should not happen with a clean delete, but good practice
        })
    ]);

    console.log(`Successfully updated database with ${newSatellites.length} satellites.`);

  } catch (error) {
    console.error('Failed to update TLE data:', error);
  }
}