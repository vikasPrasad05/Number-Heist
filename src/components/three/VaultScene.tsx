'use client';

import { useRef, useState, useEffect, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { RoundedBox, Environment, Float, Text, ContactShadows, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

function FaceText({ position, rotation }: { position: [number, number, number]; rotation: [number, number, number] }) {
    const [num, setNum] = useState(() => Math.floor(Math.random() * 900) + 100);

    useEffect(() => {
        const interval = setInterval(() => {
            setNum(Math.floor(Math.random() * 900) + 100);
        }, 500);
        return () => clearInterval(interval);
    }, []);

    return (
        <Text
            position={position}
            rotation={rotation}
            fontSize={0.22}
            color="#00d4ff"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.01}
            outlineColor="#001a33"
        >
            {num}
        </Text>
    );
}

function HolographicCube() {
    const cubeRef = useRef<THREE.Group>(null);
    const ringRef1 = useRef<THREE.Mesh>(null);
    const ringRef2 = useRef<THREE.Mesh>(null);

    const timer = useMemo(() => new THREE.Timer(), []);

    useFrame(() => {
        timer.update();
        const t = timer.getElapsed();
        if (cubeRef.current) {
            cubeRef.current.rotation.y = t * 0.15;
            cubeRef.current.rotation.x = Math.sin(t * 0.2) * 0.1;
        }
        if (ringRef1.current) {
            ringRef1.current.rotation.z = t * 0.4;
        }
        if (ringRef2.current) {
            ringRef2.current.rotation.z = -t * 0.3;
        }
    });

    const faceData = useMemo(() => [
        { pos: [0, 0, 0.51], rot: [0, 0, 0] },
        { pos: [0, 0, -0.51], rot: [0, Math.PI, 0] },
        { pos: [0.51, 0, 0], rot: [0, Math.PI / 2, 0] },
        { pos: [-0.51, 0, 0], rot: [0, -Math.PI / 2, 0] },
        { pos: [0, 0.51, 0], rot: [-Math.PI / 2, 0, 0] },
        { pos: [0, -0.51, 0], rot: [Math.PI / 2, 0, 0] },
    ], []);

    return (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
            <group ref={cubeRef}>
                {/* Main Cube Body */}
                <RoundedBox args={[1, 1, 1]} radius={0.08} smoothness={4}>
                    <meshPhysicalMaterial
                        color="#0a1628"
                        metalness={0.9}
                        roughness={0.1}
                        transparent
                        opacity={0.8}
                        emissive="#001a33"
                        emissiveIntensity={0.5}
                    />
                </RoundedBox>

                {/* Internal Glow */}
                <mesh scale={0.4}>
                    <boxGeometry />
                    <meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={2} transparent opacity={0.4} />
                </mesh>

                {/* Face Numbers */}
                {faceData.map((face, i) => (
                    <FaceText key={i} position={face.pos as any} rotation={face.rot as any} />
                ))}

                {/* Glow Wireframe */}
                <mesh scale={1.02}>
                    <boxGeometry />
                    <meshStandardMaterial wireframe color="#00ff88" transparent opacity={0.1} />
                </mesh>
            </group>

            {/* Orbiting Rings (Outside the rotating group) */}
            <mesh ref={ringRef1} rotation={[Math.PI / 3, 0, 0]}>
                <torusGeometry args={[1.3, 0.02, 16, 100]} />
                <meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={2} />
            </mesh>

            <mesh ref={ringRef2} rotation={[-Math.PI / 3, Math.PI / 4, 0]}>
                <torusGeometry args={[1.5, 0.015, 16, 100]} />
                <meshStandardMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={1} />
            </mesh>
        </Float>
    );
}

export default function VaultScene() {
    return (
        <div className="w-full h-[350px] md:h-[450px] relative pointer-events-none">
            <Canvas
                shadows
                camera={{ position: [0, 0, 4], fov: 40 }}
                style={{ background: 'transparent' }}
                onCreated={({ gl, scene }) => {
                    // WebGL context handlers
                    const canvas = gl.domElement;
                    canvas.addEventListener('webglcontextlost', (e) => {
                        e.preventDefault();
                        console.warn('WebGL Context Lost - paused rendering');
                    }, false);
                    canvas.addEventListener('webglcontextrestored', () => {
                        console.log('WebGL Context Restored - resuming rendering');
                    }, false);

                    // Optimize textures
                    scene.traverse((child) => {
                        if (child instanceof THREE.Mesh && child.material) {
                            const mat = child.material as THREE.MeshStandardMaterial;
                            if (mat.map) {
                                mat.map.flipY = false;
                                mat.map.premultiplyAlpha = false;
                            }
                        }
                    });

                }}
            >
                <ambientLight intensity={0.5} />
                <pointLight position={[5, 5, 5]} intensity={1} color="#00d4ff" />
                <pointLight position={[-5, -5, 2]} intensity={0.5} color="#00ff88" />

                <Suspense fallback={null}>
                    <HolographicCube />
                    <Environment preset="city" />
                </Suspense>

                <ContactShadows
                    position={[0, -1.8, 0]}
                    opacity={0.4}
                    scale={8}
                    blur={2}
                    color="#000000"
                />
            </Canvas>
        </div>
    );
}
