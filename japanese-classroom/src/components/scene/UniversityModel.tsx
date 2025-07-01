"use client";

import { useGLTF } from "@react-three/drei";

interface UniversityModelProps {
  position?: [number, number, number];
  scale?: number;
}

export default function UniversityModel({
  position = [0, 0, 0],
  scale = 1,
}: UniversityModelProps) {
  const { scene } = useGLTF("/3d_source/university.glb");

  return <primitive object={scene} position={position} scale={scale} />;
}
