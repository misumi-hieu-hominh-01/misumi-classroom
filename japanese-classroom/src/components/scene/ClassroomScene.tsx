"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment } from "@react-three/drei";
import { Suspense, useState } from "react";
import { Vector3 } from "three";
import StickMan from "../character";
import ThirdPersonCamera from "../camera";
import DynamicLighting from "./DynamicLighting";
import TimeDisplay from "../ui";

interface ClassroomModelProps {
  position?: [number, number, number];
  scale?: number;
}

function ClassroomModel({
  position = [0, 0, 0],
  scale = 3,
}: ClassroomModelProps) {
  const { scene } = useGLTF("/3d_source/japanese_classroom.glb");

  return <primitive object={scene} position={position} scale={scale} />;
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
    </div>
  );
}

export default function ClassroomScene() {
  const [stickmanPosition, setStickmanPosition] = useState(
    new Vector3(0, 0, 0)
  );
  const [stickmanRotation, setStickmanRotation] = useState(0);
  const [isStickmanMoving, setIsStickmanMoving] = useState(false);
  const [cameraMode, setCameraMode] = useState<"third-person" | "free">(
    "third-person"
  );

  // Dynamic lighting controls
  const [useFakeTime, setUseFakeTime] = useState(true); // Default to demo mode
  const [timeSpeed, setTimeSpeed] = useState(24); // 24x speed for quick demo

  const handleStickmanPositionChange = (
    position: Vector3,
    rotation: number,
    isMoving: boolean
  ) => {
    setStickmanPosition(position.clone());
    setStickmanRotation(rotation);
    setIsStickmanMoving(isMoving);
  };

  return (
    <div className="w-full h-screen">
      <Canvas
        camera={{ position: [15, 15, 15], fov: 75 }}
        style={{ background: "linear-gradient(to bottom, #87CEEB, #f0f8ff)" }}
        shadows // Enable shadows for better lighting
      >
        <Suspense fallback={null}>
          {/* Dynamic Lighting System */}
          <DynamicLighting useFakeTime={useFakeTime} timeSpeed={timeSpeed} />

          {/* Environment */}
          <Environment preset="studio" environmentIntensity={0.3} />

          {/* Classroom Model - Phóng to 3x */}
          <ClassroomModel scale={3} />

          <StickMan
            position={[0, 0, 0]}
            scale={0.9}
            onPositionChange={handleStickmanPositionChange}
          />

          {/* Camera System */}
          {cameraMode === "third-person" ? (
            <ThirdPersonCamera
              target={stickmanPosition}
              targetRotation={stickmanRotation}
              distance={7}
              height={6}
              smoothness={0.1}
              isMoving={isStickmanMoving}
            />
          ) : (
            <OrbitControls
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              maxPolarAngle={Math.PI / 2}
              minDistance={5}
              maxDistance={50}
            />
          )}
        </Suspense>
      </Canvas>

      {/* Time Display & Lighting Controls */}
      <TimeDisplay
        useFakeTime={useFakeTime}
        timeSpeed={timeSpeed}
        onToggleFakeTime={() => setUseFakeTime(!useFakeTime)}
        onTimeSpeedChange={setTimeSpeed}
      />

      {/* Controls UI */}
      <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg max-w-sm">
        <h2 className="text-lg font-bold text-gray-800 mb-3">🎮 Điều khiển</h2>

        <div className="space-y-2 text-sm text-gray-700">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <strong>Di chuyển:</strong>
              <div className="text-xs mt-1">
                • W/↑: Đi thẳng
                <br />
                • S/↓: Đi lùi
                <br />
                • A/←: Quay trái
                <br />• D/→: Quay phải
              </div>
            </div>
            <div>
              <strong>Camera:</strong>
              <div className="text-xs mt-1 mb-2">
                • Chuột phải + kéo: Xoay cam
                <br />• Di chuyển: Reset cam
              </div>
              <button
                onClick={() =>
                  setCameraMode((mode) =>
                    mode === "third-person" ? "free" : "third-person"
                  )
                }
                className="block w-full px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
              >
                {cameraMode === "third-person" ? "Third Person" : "Free Cam"}
              </button>
              <div className="text-xs mt-1 text-gray-500">
                Tank-style controls
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Position indicator */}
      <div className="absolute bottom-4 right-4 z-10 bg-black/70 text-white px-3 py-1 rounded text-sm">
        Position: ({stickmanPosition.x.toFixed(1)},{" "}
        {stickmanPosition.y.toFixed(1)}, {stickmanPosition.z.toFixed(1)})
      </div>

      {/* Loading overlay */}
      <Suspense fallback={<LoadingSpinner />} />
    </div>
  );
}

// Preload the GLB models
useGLTF.preload("/3d_source/japanese_classroom.glb");
useGLTF.preload("/animation/walking.glb");
