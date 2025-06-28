"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment } from "@react-three/drei";
import { Suspense, useState } from "react";
import { Vector3 } from "three";
import StickMan, { Teacher } from "../character";
import { ThirdPersonCamera, FirstPersonCamera } from "../camera";
import DynamicLighting from "./DynamicLighting";
import TimeDisplay from "../ui";
import { renderCollisionBoxes } from "./CollisionSystem";
import CollisionHelper, { PreviewCollisionBox } from "./CollisionHelper";

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

export default function ClassroomScene() {
  const [stickmanPosition, setStickmanPosition] = useState(
    new Vector3(0, 0, 0)
  );
  const [stickmanRotation, setStickmanRotation] = useState(0);
  const [isStickmanMoving, setIsStickmanMoving] = useState(false);
  const [cameraMode, setCameraMode] = useState<
    "first-person" | "third-person" | "free"
  >("third-person");

  // Debug collision boxes
  const [showCollisionBoxes, setShowCollisionBoxes] = useState(false);

  // Preview collision box state
  const [showPreviewBox, setShowPreviewBox] = useState(true);
  const [previewBoxSize, setPreviewBoxSize] = useState({
    width: 2,
    height: 2,
    depth: 2,
  });

  const handleStickmanPositionChange = (
    position: Vector3,
    rotation: number,
    isMoving: boolean
  ) => {
    setStickmanPosition(position.clone());
    setStickmanRotation(rotation);
    setIsStickmanMoving(isMoving);
  };

  // Cycle camera modes
  const cycleCameraMode = () => {
    setCameraMode((mode) => {
      if (mode === "first-person") return "third-person";
      if (mode === "third-person") return "free";
      return "first-person";
    });
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
          <DynamicLighting />

          {/* Environment */}
          <Environment preset="studio" environmentIntensity={0.3} />

          {/* Classroom Model - Phóng to 3x */}
          <ClassroomModel scale={3} />

          {/* Debug: Collision Boxes */}
          {showCollisionBoxes && renderCollisionBoxes()}

          {/* Preview Collision Box */}
          {showPreviewBox && (
            <PreviewCollisionBox
              position={stickmanPosition}
              size={previewBoxSize}
            />
          )}

          <StickMan
            position={[0, 0, 0]}
            scale={0.9}
            visible={cameraMode !== "first-person"}
            onPositionChange={handleStickmanPositionChange}
          />

          {/* Teacher - Static character with talk animation */}
          <Teacher
            position={[3, -0.7, -12.08]} // Center front of classroom
            scale={0.9}
            rotation={[0, -1.5, 0]} // Face towards students (default forward)
          />

          {/* Camera System */}
          {cameraMode === "first-person" && (
            <FirstPersonCamera
              target={stickmanPosition}
              targetRotation={stickmanRotation}
              eyeHeight={5}
              sensitivity={0.002}
              isMoving={isStickmanMoving}
              defaultPitch={-0.15}
            />
          )}

          {cameraMode === "third-person" && (
            <ThirdPersonCamera
              target={stickmanPosition}
              targetRotation={stickmanRotation}
              distance={6}
              height={6}
              smoothness={0.1}
              isMoving={isStickmanMoving}
            />
          )}

          {cameraMode === "free" && (
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

      {/* Time Display */}
      <TimeDisplay />

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
                {cameraMode === "first-person" && (
                  <>
                    • Chuột trái + kéo: Nhìn quanh
                    <br />• Góc nhìn thứ nhất
                  </>
                )}
                {cameraMode === "third-person" && (
                  <>
                    • Chuột phải + kéo: Xoay cam
                    <br />• Di chuyển: Reset cam
                  </>
                )}
                {cameraMode === "free" && (
                  <>
                    • Chuột: Xoay, zoom
                    <br />• Camera tự do
                  </>
                )}
              </div>
              <button
                onClick={cycleCameraMode}
                className="block w-full px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
              >
                {cameraMode === "first-person" && "First Person"}
                {cameraMode === "third-person" && "Third Person"}
                {cameraMode === "free" && "Free Cam"}
              </button>
              <div className="text-xs mt-1 text-gray-500">
                Tank-style controls
              </div>
            </div>
          </div>

          {/* Debug Section */}
          <div className="border-t pt-2 mt-3">
            <strong>Debug:</strong>
            <div className="grid grid-cols-1 gap-1 mt-1">
              <button
                onClick={() => setShowCollisionBoxes(!showCollisionBoxes)}
                className={`w-full px-2 py-1 text-xs rounded transition-colors ${
                  showCollisionBoxes
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-gray-500 text-white hover:bg-gray-600"
                }`}
              >
                {showCollisionBoxes
                  ? "Ẩn Collision Boxes"
                  : "Hiện Collision Boxes"}
              </button>

              <button
                onClick={() => setShowPreviewBox(!showPreviewBox)}
                className={`w-full px-2 py-1 text-xs rounded transition-colors ${
                  showPreviewBox
                    ? "bg-gray-800 text-white hover:bg-gray-900"
                    : "bg-gray-500 text-white hover:bg-gray-600"
                }`}
              >
                {showPreviewBox ? "Ẩn Preview Box" : "Hiện Preview Box"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Collision Helper */}
      <CollisionHelper
        characterPosition={stickmanPosition}
        onPreviewSizeChange={setPreviewBoxSize}
      />
    </div>
  );
}

// Preload the classroom model
useGLTF.preload("/3d_source/japanese_classroom.glb");
