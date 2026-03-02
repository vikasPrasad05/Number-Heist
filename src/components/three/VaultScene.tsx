'use client';

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { RoundedBox, Environment, Float } from '@react-three/drei';
import * as THREE from 'three';

function VaultDoor() {
    const meshRef = useRef<THREE.Mesh>(null);
    const ringRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
        }
        if (ringRef.current) {
            ringRef.current.rotation.z += 0.005;
        }
    });

    return (
        <Float speed={2} rotationIntensity={0.3} floatIntensity={0.5}>
            <group>
                {/* Vault Body */}
                <RoundedBox ref={meshRef} args={[2.5, 2.5, 0.5]} radius={0.15} smoothness={4}>
                    <meshStandardMaterial
                        color="#0a1628"
                        metalness={0.9}
                        roughness={0.15}
                        envMapIntensity={1}
                    />
                </RoundedBox>

                {/* Inner Circle */}
                <mesh position={[0, 0, 0.26]}>
                    <circleGeometry args={[0.8, 64]} />
                    <meshStandardMaterial
                        color="#050d1a"
                        metalness={0.95}
                        roughness={0.1}
                    />
                </mesh>

                {/* Rotating Ring */}
                <mesh ref={ringRef} position={[0, 0, 0.27]}>
                    <torusGeometry args={[0.85, 0.05, 16, 64]} />
                    <meshStandardMaterial
                        color="#00d4ff"
                        emissive="#00d4ff"
                        emissiveIntensity={0.6}
                        metalness={1}
                        roughness={0}
                    />
                </mesh>

                {/* Handle Lines */}
                {[0, 60, 120, 180, 240, 300].map((angle) => (
                    <mesh
                        key={angle}
                        position={[
                            Math.cos((angle * Math.PI) / 180) * 0.6,
                            Math.sin((angle * Math.PI) / 180) * 0.6,
                            0.28,
                        ]}
                        rotation={[0, 0, (angle * Math.PI) / 180]}
                    >
                        <boxGeometry args={[0.3, 0.02, 0.02]} />
                        <meshStandardMaterial
                            color="#00ff88"
                            emissive="#00ff88"
                            emissiveIntensity={0.3}
                        />
                    </mesh>
                ))}

                {/* Corner Bolts */}
                {[
                    [-1, 1],
                    [1, 1],
                    [-1, -1],
                    [1, -1],
                ].map(([x, y], i) => (
                    <mesh key={i} position={[x * 0.95, y * 0.95, 0.26]}>
                        <cylinderGeometry args={[0.06, 0.06, 0.08, 16]} />
                        <meshStandardMaterial color="#1a2a44" metalness={0.9} roughness={0.2} />
                    </mesh>
                ))}

                {/* Glow Ring */}
                <mesh position={[0, 0, 0.25]}>
                    <torusGeometry args={[1.3, 0.02, 8, 64]} />
                    <meshStandardMaterial
                        color="#00d4ff"
                        emissive="#00d4ff"
                        emissiveIntensity={0.2}
                        transparent
                        opacity={0.5}
                    />
                </mesh>
            </group>
        </Float>
    );
}

export default function VaultScene() {
    return (
        <div className="w-full h-[300px] md:h-[400px]">
            <Canvas
                camera={{ position: [0, 0, 4], fov: 45 }}
                style={{ background: 'transparent' }}
            >
                <ambientLight intensity={0.3} />
                <pointLight position={[5, 5, 5]} intensity={1} color="#00d4ff" />
                <pointLight position={[-5, -3, 3]} intensity={0.5} color="#00ff88" />
                <spotLight position={[0, 5, 5]} angle={0.3} penumbra={1} intensity={0.8} color="#b44dff" />
                <VaultScene3D />
                <Environment preset="night" />
            </Canvas>
        </div>
    );
}

function VaultScene3D() {
    return <VaultDoor />;
}
