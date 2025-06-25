// FILE: src/app/create/page.tsx
"use client";

import SatelliteVisualizer from "@/components/SatelliteVisualizer";

export default function CreatePage() {
  return (
    <div className="w-full">
      <div className="text-center py-8 sm:py-12 animate-fade-in">
        <h2 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary-accent to-white">
          Satellite Signature
        </h2>
        <p className="max-w-3xl mx-auto mt-4 text-lg text-gray-400">
          Select a satellite, see its unique signature, and generate cosmic art.
        </p>
      </div>
      <div className="animate-fade-in [animation-delay:500ms]">
        <SatelliteVisualizer />
      </div>
    </div>
  );
}