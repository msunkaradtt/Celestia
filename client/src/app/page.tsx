// FILE: src/app/page.tsx
"use client";

import ArtworkGallery from "@/components/ArtworkGallery";
import Link from "next/link";
import HeroCanvas from "@/components/HeroCanvas";

// Reusable component for the "How It Works" steps
const FeatureCard = ({ icon, title, description, number }: { icon: React.ReactNode, title: string, description: string, number: string }) => (
    <div className="relative bg-primary-dark/30 border border-primary-deep rounded-xl p-8 backdrop-blur-sm transition-all duration-300 hover:border-primary-accent hover:bg-primary-deep/30">
        <div className="absolute -top-4 -left-4 w-12 h-12 bg-primary-accent rounded-lg flex items-center justify-center text-primary-dark font-black text-2xl">
            {number}
        </div>
        <div className="mb-4 text-primary-accent">{icon}</div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-400">{description}</p>
    </div>
);

export default function LandingPage() {
    return (
        <div className="w-full relative">
            <HeroCanvas />
            
            {/* Hero Section */}
            <div className="text-center min-h-[90vh] flex flex-col items-center justify-center animate-fade-in">
                <h2 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary-accent to-white">
                    Art from Orbit
                </h2>
                <p className="max-w-3xl mx-auto mt-6 text-xl text-gray-300 leading-relaxed">
                    Transform the unseen signatures of orbital satellites into one-of-a-kind masterpieces. Your journey into cosmic art starts here.
                </p>
                <div className="mt-12">
                    <Link href="/create" className="px-10 py-4 font-bold text-lg text-primary-dark transition-all duration-300 bg-primary-accent rounded-lg shadow-lg shadow-primary-accent/30 hover:bg-white hover:scale-105 focus:outline-none focus:ring-4 focus:ring-primary-accent/50">
                        Start Creating
                    </Link>
                </div>
            </div>

            {/* How It Works Section */}
            <div className="py-24 animate-fade-in">
                 <div className="text-center mb-16">
                    <h3 className="text-4xl font-bold text-white">How It Works</h3>
                    <p className="text-lg text-gray-400 mt-2">A three-step journey from data to art.</p>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                     <FeatureCard 
                        number="1"
                        icon={<SatelliteIcon />}
                        title="Select a Satellite"
                        description="Choose from a list of real-time satellites orbiting Earth right now."
                     />
                     <FeatureCard 
                        number="2"
                        icon={<PenToolIcon />}
                        title="Generate a Signature"
                        description="We calculate its unique orbital velocity to generate a visual 'stroke'."
                     />
                     <FeatureCard 
                        number="3"
                        icon={<SparklesIcon />}
                        title="Create Your Art"
                        description="Use the signature as a guide for our AI to generate a stunning, unique piece of cosmic art."
                     />
                 </div>
            </div>

            {/* Gallery Section */}
            <div className="py-24 w-full animate-fade-in">
                <div className="text-center mb-16">
                    <h3 className="text-4xl font-bold text-white">Community Gallery</h3>
                    <p className="text-lg text-gray-400 mt-2">See what others have created.</p>
                </div>
                <ArtworkGallery />
            </div>
        </div>
    );
}

// Simple SVG Icons for the feature cards
const SatelliteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 20l-5-5 5-5"/><path d="m22 19-3-3 3-3"/><path d="M14 4l-3 3 3 3"/><path d="M2 12h10"/><path d="M17 12h5"/><circle cx="12" cy="12" r="2"/></svg>
);
const PenToolIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19 7-7 3 3-7 7-3-3Z"/><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18Z"/><path d="m2 2 7.586 7.586"/><path d="m13 18 5-5"/></svg>
);
const SparklesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.9 5.8-5.8 1.9 5.8 1.9L12 18l1.9-5.8 5.8-1.9-5.8-1.9Z"/></svg>
);