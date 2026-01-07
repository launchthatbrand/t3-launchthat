"use client";

import React, { useRef, useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Environment } from "@react-three/drei";
import * as THREE from "three";

interface BikeProps {
  color: string;
  speed: number;
  offset: number;
}

const Bike: React.FC<BikeProps> = ({ color, speed, offset }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const trailRef = useRef<THREE.Line>(null);
  const pathPoints = useRef<THREE.Vector3[]>([]);
  const maxTrailLength = 50;

  // Create a path that follows the grid
  const pathSegments = useMemo(() => {
    const segments: { start: THREE.Vector3; end: THREE.Vector3; axis: 'x' | 'z' }[] = [];
    const gridSize = 20;
    const spacing = 3;
    
    // Generate a random path
    let currentPos = new THREE.Vector3(
      (Math.random() * gridSize - gridSize / 2) * spacing,
      0.5,
      (Math.random() * gridSize - gridSize / 2) * spacing
    );
    
    for (let i = 0; i < 20; i++) {
      const axis = Math.random() > 0.5 ? 'x' : 'z';
      const distance = (Math.random() * 3 + 2) * spacing;
      const direction = Math.random() > 0.5 ? 1 : -1;
      
      const newPos = currentPos.clone();
      if (axis === 'x') {
        newPos.x += distance * direction;
      } else {
        newPos.z += distance * direction;
      }
      
      // Clamp to grid bounds
      newPos.x = Math.max(-gridSize * spacing / 2, Math.min(gridSize * spacing / 2, newPos.x));
      newPos.z = Math.max(-gridSize * spacing / 2, Math.min(gridSize * spacing / 2, newPos.z));
      
      segments.push({ start: currentPos.clone(), end: newPos, axis });
      currentPos = newPos;
    }
    
    return segments;
  }, []);

  const currentSegmentRef = useRef(0);
  const segmentProgressRef = useRef(offset);

  useFrame((_, delta) => {
    if (!meshRef.current || !trailRef.current) return;

    const segment = pathSegments[currentSegmentRef.current % pathSegments.length];
    if (!segment) return;

    // Move along current segment
    segmentProgressRef.current += delta * speed;
    
    if (segmentProgressRef.current >= 1) {
      segmentProgressRef.current = 0;
      currentSegmentRef.current = (currentSegmentRef.current + 1) % pathSegments.length;
    }

    // Interpolate position
    const t = segmentProgressRef.current;
    const pos = new THREE.Vector3().lerpVectors(segment.start, segment.end, t);
    meshRef.current.position.copy(pos);

    // Add to trail
    pathPoints.current.push(pos.clone());
    if (pathPoints.current.length > maxTrailLength) {
      pathPoints.current.shift();
    }

    // Update trail geometry
    if (pathPoints.current.length > 1) {
      const geometry = new THREE.BufferGeometry().setFromPoints(pathPoints.current);
      trailRef.current.geometry.dispose();
      trailRef.current.geometry = geometry;
    }
  });

  return (
    <group>
      {/* Bike */}
      <mesh ref={meshRef} castShadow>
        <boxGeometry args={[0.3, 0.2, 0.5]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={2}
          toneMapped={false}
        />
      </mesh>
      
      {/* Trail */}
      <line ref={trailRef}>
        <bufferGeometry />
        <lineBasicMaterial
          color={color}
          linewidth={3}
          transparent
          opacity={0.8}
        />
      </line>
    </group>
  );
};

const Mountains: React.FC = () => {
  const mountainsRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!mountainsRef.current) return;
    // Subtle parallax movement
    mountainsRef.current.position.x = Math.sin(state.clock.elapsedTime * 0.1) * 2;
  });

  // Create mountain silhouettes
  const mountainData = useMemo(() => {
    const peaks = [];
    const colors = ["#001a2e", "#002a4e", "#003a6e"];
    
    // Background mountains (furthest)
    for (let i = 0; i < 5; i++) {
      peaks.push({
        position: [
          (i - 2) * 50,
          20,
          -150
        ] as [number, number, number],
        scale: [60, 60, 40] as [number, number, number],
        color: colors[2] ?? "#003a6e",
        emissive: "#00d4ff",
        emissiveIntensity: 0.05,
      });
    }

    // Mid-range mountains
    for (let i = 0; i < 4; i++) {
      peaks.push({
        position: [
          (i - 1.5) * 45,
          15,
          -100
        ] as [number, number, number],
        scale: [50, 50, 35] as [number, number, number],
        color: colors[1] ?? "#002a4e",
        emissive: "#00d4ff",
        emissiveIntensity: 0.1,
      });
    }

    // Foreground mountains
    for (let i = 0; i < 3; i++) {
      peaks.push({
        position: [
          (i - 1) * 40,
          10,
          -60
        ] as [number, number, number],
        scale: [45, 40, 30] as [number, number, number],
        color: colors[0] ?? "#001a2e",
        emissive: "#00d4ff",
        emissiveIntensity: 0.15,
      });
    }

    return peaks;
  }, []);

  return (
    <group ref={mountainsRef}>
      {mountainData.map((mountain, i) => (
        <mesh
          key={i}
          position={mountain.position}
          scale={mountain.scale}
          castShadow
          receiveShadow
        >
          <coneGeometry args={[1, 2, 4]} />
          <meshStandardMaterial
            color={mountain.color}
            emissive={mountain.emissive}
            emissiveIntensity={mountain.emissiveIntensity}
            metalness={0.3}
            roughness={0.7}
          />
        </mesh>
      ))}
    </group>
  );
};

const GridFloor: React.FC = () => {
  const gridSize = 25;
  const spacing = 3;
  
  return (
    <group>
      {/* Ground plane with reflective surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[gridSize * spacing * 2, gridSize * spacing * 2]} />
        <meshStandardMaterial 
          color="#000208"
          metalness={0.95}
          roughness={0.05}
          envMapIntensity={1.5}
        />
      </mesh>

      {/* Enhanced grid lines */}
      <gridHelper 
        args={[gridSize * spacing, gridSize * 2, "#00d4ff", "#002a4e"]}
        position={[0, 0.02, 0]}
      />
      
      {/* Glowing center lines for perspective */}
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1, gridSize * spacing * 2]} />
        <meshBasicMaterial
          color="#00d4ff"
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
        <planeGeometry args={[1, gridSize * spacing * 2]} />
        <meshBasicMaterial
          color="#00d4ff"
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};

const Building: React.FC<{ position: [number, number, number]; height: number; color: string; type: 'tower' | 'short' | 'antenna' }> = ({ 
  position, 
  height, 
  color,
  type
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const windowsRef = useRef<THREE.InstancedMesh>(null);

  // Simplified - fewer windows
  const windowData = useMemo(() => {
    const windows: { pos: [number, number, number] }[] = [];
    const floors = Math.min(Math.floor(height / 1.5), 8); // Cap at 8 floors
    const windowsPerFloor = 4;
    
    for (let floor = 0; floor < floors; floor++) {
      for (let i = 0; i < windowsPerFloor; i++) {
        const angle = (i / windowsPerFloor) * Math.PI * 2;
        const x = Math.cos(angle) * 1.05;
        const z = Math.sin(angle) * 1.05;
        const y = -height / 2 + floor * 1.5 + 0.75;
        windows.push({ pos: [x, y, z] });
      }
    }
    return windows;
  }, [height]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 0.5 + Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.3;

    // Simplified window animation - no per-frame updates
    if (windowsRef.current && state.clock.elapsedTime % 1 < 0.016) { // Update once per second
      for (let i = 0; i < windowData.length; i++) {
        const window = windowData[i];
        if (!window) continue;
        const matrix = new THREE.Matrix4();
        matrix.setPosition(window.pos[0], window.pos[1], window.pos[2]);
        windowsRef.current.setMatrixAt(i, matrix);
      }
      windowsRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group position={position}>
      {/* Main building */}
      <mesh ref={meshRef} castShadow>
        <boxGeometry args={[2, height, 2]} />
        <meshStandardMaterial
          color="#0a0a1a"
          emissive={color}
          emissiveIntensity={0.5}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Windows */}
      <instancedMesh ref={windowsRef} args={[undefined, undefined, windowData.length]}>
        <boxGeometry args={[0.15, 0.3, 0.05]} />
        <meshStandardMaterial
          emissive={color}
          emissiveIntensity={2}
          toneMapped={false}
        />
      </instancedMesh>
      
      {/* Glowing top */}
      <mesh position={[0, height / 2 + 0.1, 0]}>
        <boxGeometry args={[2.1, 0.2, 2.1]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={3}
          toneMapped={false}
        />
      </mesh>

      {/* Antenna for tall buildings */}
      {type === 'antenna' && (
        <group position={[0, height / 2 + 1, 0]}>
          <mesh>
            <cylinderGeometry args={[0.05, 0.05, 3, 8]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={2}
              toneMapped={false}
            />
          </mesh>
          <pointLight color={color} intensity={3} distance={15} />
          {/* Beacon light at top */}
          <mesh position={[0, 1.5, 0]}>
            <sphereGeometry args={[0.15, 8, 8]} />
            <meshBasicMaterial color={color} />
          </mesh>
        </group>
      )}

      {/* Edge lights */}
      <mesh position={[1.05, 0, 0]}>
        <boxGeometry args={[0.05, height, 0.05]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.5}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[-1.05, 0, 0]}>
        <boxGeometry args={[0.05, height, 0.05]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.5}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, 0, 1.05]}>
        <boxGeometry args={[0.05, height, 0.05]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.5}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, 0, -1.05]}>
        <boxGeometry args={[0.05, height, 0.05]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.5}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
};

const Particle: React.FC<{ position: [number, number, number]; color: string }> = ({ position, color }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const velocity = useRef(new THREE.Vector3(
    (Math.random() - 0.5) * 0.02,
    Math.random() * 0.05 + 0.02,
    (Math.random() - 0.5) * 0.02
  ));

  useFrame(() => {
    if (!meshRef.current) return;
    meshRef.current.position.add(velocity.current);
    
    // Reset if too high
    if (meshRef.current.position.y > 30) {
      meshRef.current.position.y = 0;
    }

    // Fade with height
    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = Math.max(0.2, 1 - meshRef.current.position.y / 30);
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.08, 8, 8]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.8}
      />
    </mesh>
  );
};

const FloatingData: React.FC = () => {
  const particles = useMemo(() => {
    const result: { pos: [number, number, number]; color: string }[] = [];
    const colors = ["#00d4ff", "#ff00ff", "#00ff88", "#ffaa00"];
    
    // Reduced from 100 to 30
    for (let i = 0; i < 30; i++) {
      result.push({
        pos: [
          (Math.random() - 0.5) * 80,
          Math.random() * 20,
          (Math.random() - 0.5) * 80
        ],
        color: colors[Math.floor(Math.random() * colors.length)] ?? "#00d4ff"
      });
    }
    
    return result;
  }, []);

  return (
    <>
      {particles.map((particle, i) => (
        <Particle key={i} position={particle.pos} color={particle.color} />
      ))}
    </>
  );
};

const CentralSpire: React.FC = () => {
  const spireRef = useRef<THREE.Group>(null);
  const ringsRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!ringsRef.current) return;
    ringsRef.current.rotation.y = state.clock.elapsedTime * 0.5;
  });

  return (
    <group ref={spireRef} position={[0, 0, -20]}>
      {/* Main central spire */}
      <mesh position={[0, 15, 0]} castShadow>
        <cylinderGeometry args={[0.5, 2, 30, 8]} />
        <meshStandardMaterial
          color="#001a2e"
          emissive="#00d4ff"
          emissiveIntensity={0.8}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      {/* Spire top */}
      <mesh position={[0, 30.5, 0]}>
        <coneGeometry args={[0.5, 2, 8]} />
        <meshBasicMaterial color="#00d4ff" />
      </mesh>

      {/* Glowing core */}
      <pointLight position={[0, 30, 0]} intensity={5} distance={50} color="#00d4ff" />

      {/* Rotating energy rings */}
      <group ref={ringsRef} position={[0, 25, 0]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[0, i * 3, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[3 + i, 0.1, 16, 32]} />
            <meshBasicMaterial color="#00d4ff" transparent opacity={0.6 - i * 0.15} />
          </mesh>
        ))}
      </group>

      {/* Base platform */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[8, 10, 1, 8]} />
        <meshStandardMaterial
          color="#001a2e"
          emissive="#00d4ff"
          emissiveIntensity={0.5}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Platform lights */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const angle = (i / 8) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * 9, 1, Math.sin(angle) * 9]}
          >
            <cylinderGeometry args={[0.2, 0.2, 2, 8]} />
            <meshBasicMaterial color="#00d4ff" />
          </mesh>
        );
      })}
    </group>
  );
};

const City: React.FC = () => {
  const buildings = useMemo(() => {
    const result: { pos: [number, number, number]; height: number; color: string; type: 'tower' | 'short' | 'antenna' }[] = [];
    const gridSize = 12;
    const spacing = 3;
    const colors = ["#00d4ff", "#0099ff", "#00ffcc"];
    
    for (let x = -gridSize; x <= gridSize; x += 2) {
      for (let z = -gridSize; z <= gridSize; z += 2) {
        // Skip center area for the spire
        if (Math.abs(x) < 4 && z > -8 && z < 0) {
          continue;
        }

        // Create roads every 4 units
        const isRoadX = x % 4 === 0;
        const isRoadZ = z % 4 === 0;
        
        // Skip buildings on roads
        if (isRoadX || isRoadZ) {
          continue;
        }

        // Buildings get shorter as they get further back
        const depthFactor = Math.max(0.3, 1 - (z + gridSize * spacing) / (gridSize * spacing * 3));
        const height = (Math.random() * 10 + 3) * depthFactor;
        
        // Predominantly cyan color scheme
        const color = colors[Math.floor(Math.random() * colors.length)] ?? "#00d4ff";
        const xPos = x * spacing;
        const zPos = z * spacing;
        
        // Determine building type based on height
        let type: 'tower' | 'short' | 'antenna' = 'tower';
        if (height < 4) {
          type = 'short';
        } else if (height > 8 && z < 0) {
          type = 'antenna';
        }
        
        result.push({
          pos: [xPos, height / 2, zPos],
          height,
          color,
          type
        });
      }
    }
    
    return result;
  }, []);

  return (
    <>
      {buildings.map((building, i) => (
        <Building
          key={i}
          position={building.pos}
          height={building.height}
          color={building.color}
          type={building.type}
        />
      ))}
    </>
  );
};

const ScanLine: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 15 + 15;
    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = 0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0, 80, 64]} />
      <meshBasicMaterial
        color="#00d4ff"
        transparent
        opacity={0.3}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

const EnergyBeam: React.FC<{ from: [number, number, number]; to: [number, number, number]; color: string }> = ({ 
  from, 
  to, 
  color 
}) => {
  const lineRef = useRef<THREE.Line>(null);
  const [visible, setVisible] = useState(true);

  useFrame((state) => {
    if (!lineRef.current) return;
    
    // Pulse effect
    const mat = lineRef.current.material as THREE.LineBasicMaterial;
    mat.opacity = 0.6 + Math.sin(state.clock.elapsedTime * 3 + from[0]) * 0.3;
    
    // Occasionally hide/show
    if (Math.random() > 0.995) {
      setVisible(!visible);
    }
  });

  const points = useMemo(() => [
    new THREE.Vector3(...from),
    new THREE.Vector3(...to)
  ], [from, to]);

  if (!visible) return null;

  return (
    <line ref={lineRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length}
          array={new Float32Array(points.flatMap(p => [p.x, p.y, p.z]))}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color={color} transparent opacity={0.6} />
    </line>
  );
};

const DataStreams: React.FC = () => {
  const beams = useMemo(() => {
    const result: { from: [number, number, number]; to: [number, number, number]; color: string }[] = [];
    const colors = ["#00d4ff", "#ff00ff", "#00ff88"];
    
    // Reduced from 20 to 8
    for (let i = 0; i < 8; i++) {
      const height1 = Math.random() * 15 + 5;
      const height2 = Math.random() * 15 + 5;
      result.push({
        from: [
          (Math.random() - 0.5) * 60,
          height1,
          (Math.random() - 0.5) * 60
        ],
        to: [
          (Math.random() - 0.5) * 60,
          height2,
          (Math.random() - 0.5) * 60
        ],
        color: colors[Math.floor(Math.random() * colors.length)] ?? "#00d4ff"
      });
    }
    
    return result;
  }, []);

  return (
    <>
      {beams.map((beam, i) => (
        <EnergyBeam key={i} from={beam.from} to={beam.to} color={beam.color} />
      ))}
    </>
  );
};

const HeroCamera: React.FC = () => {
  const cameraTargetRef = useRef({ x: 0, y: 10, z: -20 });

  useFrame((state) => {
    // Smooth cinematic camera movement
    const t = state.clock.elapsedTime * 0.1;
    cameraTargetRef.current.x = Math.sin(t) * 5;
    cameraTargetRef.current.y = 12 + Math.sin(t * 0.5) * 3;
    
    state.camera.lookAt(
      cameraTargetRef.current.x,
      cameraTargetRef.current.y,
      cameraTargetRef.current.z
    );
  });

  return null;
};

const AtmosphericEffects: React.FC = () => {
  const cloudRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!cloudRef.current) return;
    cloudRef.current.position.x = Math.sin(state.clock.elapsedTime * 0.05) * 10;
  });

  return (
    <group ref={cloudRef}>
      {/* Low-lying fog/clouds */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[(i - 1.5) * 30, 3, -80 - i * 10]}>
          <sphereGeometry args={[20, 16, 16]} />
          <meshBasicMaterial
            color="#001a2e"
            transparent
            opacity={0.15}
            fog={false}
          />
        </mesh>
      ))}
    </group>
  );
};

export const TronScene: React.FC = () => {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 15, 50], fov: 70 }}
      gl={{ 
        antialias: true, 
        alpha: false,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.2
      }}
    >
      {/* Dramatic gradient background */}
      <color attach="background" args={["#000510"]} />
      <fog attach="fog" args={["#000510", 50, 200]} />

      {/* Starfield */}
      <Stars 
        radius={300} 
        depth={100} 
        count={2000} 
        factor={6} 
        saturation={0.3} 
        fade 
        speed={0.3} 
      />

      {/* Enhanced lighting for hero shot */}
      <ambientLight intensity={0.1} />
      
      {/* Key light - from above and behind camera */}
      <directionalLight
        position={[0, 50, 40]}
        intensity={0.6}
        color="#00d4ff"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={200}
      />

      {/* Rim light for mountains */}
      <directionalLight
        position={[50, 30, -100]}
        intensity={0.3}
        color="#00aaff"
      />

      {/* Central dramatic uplighting */}
      <pointLight position={[0, 5, -20]} intensity={4} distance={100} color="#00d4ff" />
      <spotLight
        position={[0, 40, -20]}
        angle={Math.PI / 6}
        penumbra={0.5}
        intensity={2}
        distance={100}
        color="#00d4ff"
        target-position={[0, 0, -20]}
        castShadow
      />

      {/* Accent lights */}
      <pointLight position={[-40, 20, 0]} intensity={1} distance={100} color="#0099ff" />
      <pointLight position={[40, 20, 0]} intensity={1} distance={100} color="#00ffcc" />

      {/* Scene hierarchy - back to front */}
      <Mountains />
      <AtmosphericEffects />
      <GridFloor />
      <City />
      <CentralSpire />
      <FloatingData />
      <DataStreams />
      <ScanLine />
      
      {/* Light trail bikes */}
      <Bike color="#00d4ff" speed={0.25} offset={0} />
      <Bike color="#00ffcc" speed={0.3} offset={0.5} />

      {/* Cinematic camera */}
      <HeroCamera />

      {/* Manual controls (can be disabled for final hero shot) */}
      <OrbitControls 
        enableDamping 
        dampingFactor={0.05}
        minDistance={20}
        maxDistance={100}
        maxPolarAngle={Math.PI / 2}
        target={[0, 10, -20]}
      />
    </Canvas>
  );
};

