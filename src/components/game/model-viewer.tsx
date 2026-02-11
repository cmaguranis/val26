import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

interface ModelViewerProps {
  geometry: THREE.BufferGeometry;
  color?: string;
  autoRotate?: boolean;
}

function Model({ geometry, color, autoRotate }: ModelViewerProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (autoRotate && meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial 
        color={color || "#888888"} 
        side={THREE.DoubleSide} 
        roughness={0.5}
        metalness={0.1}
      />
      <lineSegments>
        <wireframeGeometry args={[geometry]} />
        <lineBasicMaterial color="black" linewidth={1} opacity={0.2} transparent />
      </lineSegments>
    </mesh>
  );
}

export function ModelViewer({ geometry, color, autoRotate = true }: ModelViewerProps) {
  return (
    <div className="w-full h-full min-h-[300px] bg-slate-950 rounded-lg overflow-hidden border border-slate-800">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 4]} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Model geometry={geometry} color={color} autoRotate={autoRotate} />
        <OrbitControls enableZoom={false} />
      </Canvas>
    </div>
  );
}
