"use client";

import React, { Suspense, useRef } from "react";
import {
  Grid,
  OrbitControls,
  PerspectiveCamera,
  Trail,
} from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import type { Mesh } from "three";

const Tower = ({
  position,
  size = [1, 4, 1],
  color = "#0ea5e9",
  emissive = "#0ea5e9",
  capColor = "#67e8f9",
}: {
  position: [number, number, number];
  size?: [number, number, number];
  color?: string;
  emissive?: string;
  capColor?: string;
}) => {
  return (
    <>
      <mesh position={position} castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={0.08}
          metalness={0.12}
          roughness={0.32}
        />
      </mesh>
      <mesh position={[position[0], position[1] + size[1] / 2 + 0.08, position[2]]}>
        <boxGeometry args={[size[0] * 0.8, 0.16, size[2] * 0.8]} />
        <meshStandardMaterial
          color={capColor}
          emissive={capColor}
          emissiveIntensity={0.22}
          metalness={0.2}
          roughness={0.25}
        />
      </mesh>
    </>
  );
};

const GridCity = () => {
  const groupRef = useRef<Mesh | null>(null);
  useFrame((_, delta: number) => {
    const group = groupRef.current;
    if (!group) return;
    group.rotation.y += delta * 0.08;
  });

  const blocks: Array<{
    pos: [number, number, number];
    size: [number, number, number];
    color: string;
    emissive: string;
  }> = [];

  // Expand city footprint and add variation + spacing/jitter for a tron-like grid.
  const spacing = 1.8;
  for (let x = -7; x <= 7; x++) {
    for (let z = -7; z <= 7; z++) {
      const jitterX = (Math.random() - 0.5) * 0.35;
      const jitterZ = (Math.random() - 0.5) * 0.35;
      const height = 2 + Math.random() * 12;
      const taper = 0.5 + Math.random() * 0.8;
      const size: [number, number, number] = [taper, height, taper];
      const pos: [number, number, number] = [
        x * spacing + jitterX,
        height / 2,
        z * spacing + jitterZ,
      ];
      const colorPick = Math.random();
      const color =
        colorPick > 0.8
          ? "#38bdf8"
          : colorPick > 0.6
            ? "#22d3ee"
            : colorPick > 0.35
              ? "#67e8f9"
              : "#0ea5e9";
      const emissive = colorPick > 0.5 ? "#0ea5e9" : "#0ea5e9";
      const capColor = colorPick > 0.5 ? "#a5f3fc" : "#67e8f9";
      blocks.push({ pos, size, color, emissive, capColor });
    }
  }

  return (
    <group ref={groupRef}>
      {blocks.map((b, idx) => (
        <Tower
          key={idx}
          position={b.pos}
          size={b.size}
          color={b.color}
          emissive={b.emissive}
          capColor={b.capColor}
        />
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#0b1220" roughness={1} />
      </mesh>
      <Grid
        args={[80, 80]}
        cellSize={1}
        cellThickness={0.4}
        sectionSize={4}
        sectionThickness={1}
        cellColor="#0ea5e9"
        sectionColor="#38bdf8"
        fadeDistance={60}
        fadeStrength={1}
        position={[0, 0.01, 0]}
      />
    </group>
  );
};

const BikeWithTrail = ({
  gridSize = 14,
  gridSpacing = 1.8,
  height = 1.6,
  speed = 4,
  color = "#38bdf8",
  start = { x: 0, z: 0 },
}: {
  gridSize?: number;
  gridSpacing?: number;
  height?: number;
  speed?: number; // units per second along road
  color?: string;
  start?: { x: number; z: number };
}) => {
  type Axis = "x" | "z";
  const ref = useRef<Mesh | null>(null);
  const dirRef = useRef<{ axis: Axis; sign: 1 | -1 }>({
    axis: Math.random() > 0.5 ? "x" : "z",
    sign: Math.random() > 0.5 ? 1 : -1,
  });
  const posRef = useRef<{ x: number; z: number }>({ x: start.x, z: start.z });

  const chooseNewDir = () => {
    const axis: Axis = dirRef.current.axis === "x" ? "z" : "x";
    const sign: 1 | -1 = Math.random() > 0.5 ? 1 : -1;
    dirRef.current = { axis, sign };
  };

  useFrame((state, delta) => {
    const mesh = ref.current;
    if (!mesh) return;
    const { axis, sign } = dirRef.current;
    const dist = speed * delta;
    posRef.current[axis] += dist * sign;

    const limit = (gridSize * gridSpacing) / 2;
    if (posRef.current[axis] > limit) {
      posRef.current[axis] = limit;
      dirRef.current.sign = -1;
    } else if (posRef.current[axis] < -limit) {
      posRef.current[axis] = -limit;
      dirRef.current.sign = 1;
    }

    // occasional random turn at intersections
    if (Math.random() < 0.01) {
      chooseNewDir();
    }

    const y = height;
    const { x, z } = posRef.current;
    mesh.position.set(x, y, z);
    mesh.rotation.y = axis === "x" ? (sign === 1 ? 0 : Math.PI) : sign === 1 ? -Math.PI / 2 : Math.PI / 2;
  });

  return (
    <Trail
      width={0.22}
      color={color}
      length={25}
      decay={0.9}
      blend="additive"
      attenuation={(t) => t}
    >
      <mesh ref={ref} castShadow>
        <boxGeometry args={[0.5, 0.3, 1.1]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.4}
          metalness={0.2}
          roughness={0.2}
          toneMapped={false}
        />
      </mesh>
    </Trail>
  );
};

export const TestHeroScene = () => {
  return (
    <section className="bg-background/60 mx-auto my-12 w-full max-w-5xl rounded-3xl border p-4 shadow-md dark:bg-neutral-900/60">
      <div className="relative h-[420px] w-full overflow-hidden rounded-2xl">
        <Suspense
          fallback={
            <div className="text-muted-foreground grid h-full place-items-center">
              Loading 3D…
            </div>
          }
        >
          <Canvas
            shadows
            camera={{ position: [3, 2, 4], fov: 50 }}
            className="bg-neutral-900"
          >
            <PerspectiveCamera makeDefault position={[8, 6, 8]} fov={50} />
            <color attach="background" args={["#050915"]} />
            <fog attach="fog" args={["#050915", 10, 45]} />
            <ambientLight intensity={0.5} />
            <directionalLight position={[8, 12, 8]} intensity={1.4} castShadow />
            <pointLight position={[-6, 6, -6]} intensity={0.6} />
            <pointLight position={[6, 4, 6]} intensity={0.7} color="#38bdf8" />
            <GridCity />
            <BikeWithTrail gridSize={14} gridSpacing={1.8} height={1.5} speed={4} color="#22d3ee" />
            <BikeWithTrail gridSize={14} gridSpacing={1.8} height={1.7} speed={3.6} color="#67e8f9" start={{ x: 5, z: -5 }} />
            <BikeWithTrail gridSize={14} gridSpacing={1.8} height={1.3} speed={4.4} color="#0ea5e9" start={{ x: -6, z: 4 }} />
            <OrbitControls enableDamping dampingFactor={0.1} />
          </Canvas>
        </Suspense>
      </div>
    </section>
  );
};

