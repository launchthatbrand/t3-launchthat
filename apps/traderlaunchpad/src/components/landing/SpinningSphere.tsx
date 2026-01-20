"use client";

import * as THREE from "three";

import { Canvas, useFrame } from "@react-three/fiber";
import React, { Suspense, useMemo, useRef } from "react";

import { useTexture } from "@react-three/drei";

const AXIAL_TILT_RADIANS = (25.19 * Math.PI) / 180;
const KEY_LIGHT_DIR = new THREE.Vector3(1.0, 0.6, 0.8).normalize(); // top-right/front

const Atmosphere = () => {
    // Simple fresnel-style atmosphere glow
    const material = useMemo(() => {
        return new THREE.ShaderMaterial({
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            uniforms: {
                uColor: { value: new THREE.Color("#ffffff") },
                uPower: { value: 3.2 },
                uIntensity: { value: 0.42 },
                uLightDir: { value: KEY_LIGHT_DIR.clone() },
            },
            vertexShader: `
                varying vec3 vWorldNormal;
                varying vec3 vWorldPosition;
                void main() {
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    vWorldNormal = normalize(mat3(modelMatrix) * normal);
                    gl_Position = projectionMatrix * viewMatrix * worldPosition;
                }
            `,
            fragmentShader: `
                uniform vec3 uColor;
                uniform float uPower;
                uniform float uIntensity;
                uniform vec3 uLightDir;
                varying vec3 vWorldNormal;
                varying vec3 vWorldPosition;
                void main() {
                    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
                    float fresnel = pow(1.0 - max(dot(viewDir, normalize(vWorldNormal)), 0.0), uPower);
                    // Only glow on the lit limb so the night side fades into the background.
                    float ndl = max(dot(normalize(vWorldNormal), normalize(uLightDir)), 0.0);
                    float litMask = smoothstep(0.05, 0.6, ndl);
                    float alpha = fresnel * litMask * uIntensity;
                    gl_FragColor = vec4(uColor, alpha);
                }
            `,
        });
    }, []);

    return (

        <mesh scale={1.03}>
            <sphereGeometry args={[1, 96, 96]} />
            <primitive object={material} attach="material" />
        </mesh>
    );
};

const MarsModel = () => {
    const groupRef = useRef<THREE.Group | null>(null);
    // NOTE: 8K textures frequently cause WebGL "context lost" on laptops / iGPUs.
    // We keep the 8K source in public for later, but render with a GPU-friendly 2K version.
    const colorMap = useTexture("/mars-2k.jpg");

    const map = useMemo(() => {
        // Clone so we can safely tweak sampler settings without mutating the cached texture.
        const t = colorMap.clone();
        // Make the texture orient correctly on a sphere.
        t.repeat.set(1, -1);
        t.offset.set(0, 1);
        t.colorSpace = THREE.SRGBColorSpace;
        // Reduce GPU memory usage: disable mipmaps for this large equirect texture.
        t.generateMipmaps = false;
        t.minFilter = THREE.LinearFilter;
        t.magFilter = THREE.LinearFilter;
        t.needsUpdate = true;
        return t;
    }, [colorMap]);

    useFrame((_state, delta) => {
        const group = groupRef.current;
        if (!group) return;
        // Spin cleanly around the planet's north/south axis.
        group.rotation.y += delta * 0.18;
    });

    return (
        <group ref={groupRef} rotation={[0, 0, AXIAL_TILT_RADIANS]} scale={0.9}>
            <mesh>
                <sphereGeometry args={[1, 96, 96]} />
                <meshStandardMaterial map={map} roughness={0.95} metalness={0} />
            </mesh>
            <Atmosphere />
        </group>
    );
};

export const SpinningSphere = () => {
    return (
        <Canvas
            // Keep DPR low to reduce GPU memory/pressure and prevent context loss.
            dpr={1}
            camera={{ position: [0, 0, 3], fov: 45 }}
            gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
        >
            {/* Key light: top-right, strong. Keep ambient/fill very low so the night side fades out. */}
            <ambientLight intensity={0.08} />
            <directionalLight
                position={[KEY_LIGHT_DIR.x * 10, KEY_LIGHT_DIR.y * 10, KEY_LIGHT_DIR.z * 10]}
                intensity={2.2}
                color="#ffb07a"
            />
            {/* Extremely subtle cool fill to avoid total black on low-contrast displays. */}
            <directionalLight position={[-2, -1.2, -2]} intensity={0.06} color="#6aa7ff" />
            <Suspense fallback={null}>
                <MarsModel />
            </Suspense>
        </Canvas>
    );
};

useTexture.preload("/mars-2k.jpg");

