// FILE: src/components/SatelliteVisualizer.tsx
"use client";

import { useRef, useState, useEffect } from 'react';
import * as satellite from 'satellite.js';
import ArtGenerationModal, { ArtGenerationParams } from './ArtGenerationModal';
import { useRouter } from 'next/navigation';
import QueueStatus from './QueueStatus';

// Define data structures
interface TleData { name: string; line1: string; line2: string; }
interface StrokeData {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    lineWidth: number;
    strokeStyle: string;
}
interface QueueStatusState { waiting: number; active: number; }

const SatelliteVisualizer = () => {
    const visibleCanvasRef = useRef<HTMLCanvasElement>(null);
    const mapImageRef = useRef<HTMLImageElement | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    
    const [tleList, setTleList] = useState<TleData[]>([]);
    const [selectedSat, setSelectedSat] = useState<TleData | null>(null);
    const [strokeData, setStrokeData] = useState<StrokeData | null>(null);
    const [isMapLoaded, setIsMapLoaded] = useState(false);
    
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const router = useRouter();

    const [queueStatus, setQueueStatus] = useState<QueueStatusState | null>(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    const WS_URL = process.env.NEXT_PUBLIC_WS_URL;

    // Effect to establish and manage the WebSocket connection
    useEffect(() => {
        if (!WS_URL) {
            console.error("WebSocket URL (NEXT_PUBLIC_WS_URL) is not configured.");
            return;
        }
        if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
            const ws = new WebSocket(WS_URL);
            wsRef.current = ws;

            ws.onopen = () => console.log('WebSocket connection established.');
            ws.onclose = () => console.log('WebSocket connection closed.');
            ws.onerror = (err) => console.error('WebSocket error:', err);

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'queue_update') {
                        setQueueStatus({ waiting: data.waiting, active: data.active });
                    }
                    if (data.type === 'artwork_completed') {
                        router.refresh();
                    }
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };
        }
        return () => {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.close();
            }
        };
    }, [router, WS_URL]);

    // Effect to preload the map image
    useEffect(() => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Equirectangular_projection_SW.jpg/1200px-Equirectangular_projection_SW.jpg';
        img.onload = () => {
            mapImageRef.current = img;
            setIsMapLoaded(true);
        };
    }, []);

    // Effect to fetch the satellite list
    useEffect(() => {
        if (!API_URL) {
            setError("API URL (NEXT_PUBLIC_API_URL) is not configured.");
            setIsLoading(false);
            return;
        }
        const fetchTleList = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`${API_URL}/api/tle-data/gnss`);
                if (!res.ok) throw new Error('Failed to fetch satellite list.');
                const data: TleData[] = await res.json();
                setTleList(data);
                if (data.length > 0) {
                    setSelectedSat(data[0]);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchTleList();
    }, [API_URL]);

    // Effect to calculate stroke data
    useEffect(() => {
        if (selectedSat) {
            const canvas = visibleCanvasRef.current;
            if (!canvas) return;
            const satrec = satellite.twoline2satrec(selectedSat.line1, selectedSat.line2);
            const positionAndVelocity = satellite.propagate(satrec, new Date());
            
            // --- THE FIX: Check if the calculation was successful ---
            if (!positionAndVelocity || typeof positionAndVelocity.velocity === 'undefined') {
                console.error(`Could not calculate position for ${selectedSat.name}.`);
                return; // Exit the function early if data is invalid
            }
            // --- END FIX ---

            const velocity = positionAndVelocity.velocity as satellite.EciVec3<number>;
            const startX = canvas.width / 2 + (velocity.x * 20);
            const startY = canvas.height / 2 + (velocity.y * 20);
            const endX = startX + (velocity.z * 50);
            const endY = startY - (velocity.x * 50);
            const lineWidth = Math.max(1, Math.abs(velocity.y * 2));
            const hue = (Math.atan2(velocity.y, velocity.x) * 180 / Math.PI + 180) % 360;
            setStrokeData({
                startX, startY, endX, endY, lineWidth,
                strokeStyle: `hsla(${hue}, 90%, 70%, 0.9)`
            });
        }
    }, [selectedSat]);

    // Effect to draw on the canvas
    useEffect(() => {
        if (!isMapLoaded || !mapImageRef.current || !strokeData) return;
        const canvas = visibleCanvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas) return;
        ctx.drawImage(mapImageRef.current, 0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        ctx.moveTo(strokeData.startX, strokeData.startY);
        ctx.lineTo(strokeData.endX, strokeData.endY);
        ctx.strokeStyle = strokeData.strokeStyle;
        ctx.lineWidth = strokeData.lineWidth;
        ctx.lineCap = 'round';
        ctx.shadowColor = strokeData.strokeStyle;
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;
    }, [strokeData, isMapLoaded]);

    const handleDropdownChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const satName = event.target.value;
        const satelliteToSelect = tleList.find(sat => sat.name === satName);
        if (satelliteToSelect) {
            setSelectedSat(satelliteToSelect);
        }
    };
  
    const handleArtGenerationSubmit = (params: ArtGenerationParams) => {
        if (!strokeData || !selectedSat || !API_URL) return;
        setIsGenerating(true);
        setError(null);
        const hiddenCanvas = document.createElement('canvas');
        hiddenCanvas.width = 600;
        hiddenCanvas.height = 300;
        const ctx = hiddenCanvas.getContext('2d');
        if(!ctx) {
            setIsGenerating(false);
            return;
        }
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, hiddenCanvas.width, hiddenCanvas.height);
        ctx.beginPath();
        ctx.moveTo(strokeData.startX, strokeData.startY);
        ctx.lineTo(strokeData.endX, strokeData.endY);
        ctx.strokeStyle = strokeData.strokeStyle;
        ctx.lineWidth = strokeData.lineWidth;
        ctx.lineCap = 'round';
        ctx.stroke();
        hiddenCanvas.toBlob(async (blob) => {
            if (!blob) {
                setIsGenerating(false);
                return;
            }
            try {
                const formData = new FormData();
                formData.append('image', blob, 'signature.png');
                formData.append('prompt', params.prompt);
                formData.append('negativePrompt', params.negativePrompt);
                formData.append('imageName', params.imageName);
                formData.append('satelliteName', selectedSat.name);

                const res = await fetch(`${API_URL}/api/art/generate`, { method: 'POST', body: formData });
                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.error || `Artwork generation failed.`);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            } finally {
                setIsGenerating(false);
                setIsModalOpen(false);
            }
        }, 'image/png');
    };

  return (
    <>
      <style jsx global>{`.custom-select option { background-color: #3A0519; color: #E5E7EB; }`}</style>
      <div className="w-full flex flex-col items-center space-y-8 bg-primary-dark/30 backdrop-blur-sm p-6 rounded-xl border border-primary-deep">
        <div className="w-full max-w-lg flex flex-col items-center">
            <label htmlFor="satellite-select" className="text-lg font-bold mb-3 text-gray-300">1. Select a Satellite</label>
            <select
                id="satellite-select"
                disabled={isLoading}
                onChange={handleDropdownChange}
                value={selectedSat ? selectedSat.name : ""}
                className="custom-select w-full p-3 bg-primary-deep/50 border border-primary-vibrant rounded-md text-white focus:ring-2 focus:ring-primary-accent focus:border-primary-accent appearance-none text-center cursor-pointer"
            >
                {isLoading && <option value="" disabled>Loading satellites...</option>}
                {!isLoading && tleList.map(sat => <option key={sat.name} value={sat.name}>{sat.name}</option>)}
            </select>
            {error && <p className="text-center text-red-400 mt-2">{error}</p>}
        </div>
        <div className="w-full flex flex-col items-center animate-fade-in">
            <h3 className="text-lg font-bold mb-4 text-gray-300">
                2. View Signature: <span className="text-primary-accent font-semibold">{selectedSat ? selectedSat.name : 'Loading...'}</span>
            </h3>
            <canvas
                ref={visibleCanvasRef}
                width="800"
                height="400"
                className="bg-primary-dark rounded-lg shadow-inner border border-primary-deep w-full max-w-2xl"
            />
            {selectedSat && (
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="mt-6 px-8 py-3 font-bold text-primary-dark transition-all duration-300 bg-primary-accent rounded-lg shadow-lg shadow-primary-accent/20 hover:bg-white hover:text-primary-dark hover:scale-105 focus:outline-none focus:ring-4 focus:ring-primary-accent/50"
                >
                    3. Generate Final Artwork
                </button>
            )}
        </div>
      </div>
      <ArtGenerationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleArtGenerationSubmit}
        isGenerating={isGenerating}
      />
      <QueueStatus queueStatus={queueStatus} />
    </>
  );
};
export default SatelliteVisualizer;