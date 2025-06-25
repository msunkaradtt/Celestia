// FILE: src/components/HeroCanvas.tsx
"use client";

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// This component creates the interactive, drifting starfield
function DriftingStars() {
    const pointsRef = useRef<THREE.Points>(null!);

    const particles = useMemo(() => {
        const count = 7000; // Increased particle count for a denser feel
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 25;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 25;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 15;

            const color = new THREE.Color();
            color.set(Math.random() > 0.3 ? '#A53860' : '#EF88AD');
            colors.set([color.r, color.g, color.b], i * 3);
        }
        return { positions, colors };
    }, []);

    useFrame((state) => {
        const { clock, pointer } = state;
        if (pointsRef.current) {
            // Constant rotation for ambiance
            pointsRef.current.rotation.y = clock.getElapsedTime() * 0.05;

            // Parallax effect based on mouse position
            const targetX = pointer.x * 0.1;
            const targetY = pointer.y * 0.1;
            
            pointsRef.current.position.x = THREE.MathUtils.lerp(pointsRef.current.position.x, targetX, 0.02);
            pointsRef.current.position.y = THREE.MathUtils.lerp(pointsRef.current.position.y, targetY, 0.02);
        }
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={particles.positions.length / 3}
                    array={particles.positions}
                    itemSize={3}
                />
                <bufferAttribute
                    attach="attributes-color"
                    count={particles.colors.length / 3}
                    array={particles.colors}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.02}
                sizeAttenuation
                vertexColors
                transparent
                opacity={0.9}
            />
        </points>
    );
}

// The main component that renders our beautiful background
const HeroCanvas = () => {
    return (
        <div className="absolute top-0 left-0 w-full h-full -z-10">
            <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
                <fog attach="fog" args={['#3A0519', 5, 12]} />
                <DriftingStars />
            </Canvas>
        </div>
    );
};

export default HeroCanvas;