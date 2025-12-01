"use client";

import React, { Suspense, useRef } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, Stage, Center, Html } from "@react-three/drei";
import { STLLoader } from "three-stdlib";
import { Mesh } from "three";

interface ModelViewerProps {
    stlUrl: string | null;
}

function Model({ url }: { url: string }) {
    const geom = useLoader(STLLoader, url);
    const meshRef = useRef<Mesh>(null);

    return (
        <mesh ref={meshRef} geometry={geom} castShadow receiveShadow>
            <meshStandardMaterial color="#6366f1" roughness={0.5} metalness={0.1} />
        </mesh>
    );
}

export default function ModelViewer({ stlUrl }: ModelViewerProps) {
    if (!stlUrl) {
        return (
            <div className="flex items-center justify-center h-full w-full bg-slate-900/50 rounded-xl border border-slate-800 text-slate-400">
                <p>No model generated yet.</p>
            </div>
        );
    }

    return (
        <div className="h-full w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800 relative">
            <Canvas shadows camera={{ position: [0, 0, 150], fov: 50 }}>
                <Suspense fallback={<Html center><div className="text-white">Loading 3D Model...</div></Html>}>
                    <Stage environment="city" intensity={0.6}>
                        <Center>
                            <Model url={stlUrl} />
                        </Center>
                    </Stage>
                </Suspense>
                <OrbitControls makeDefault enableDamping dampingFactor={0.05} />
            </Canvas>
            <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded text-xs backdrop-blur-sm">
                Interactive 3D View
            </div>
        </div>
    );
}
