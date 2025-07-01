"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { Suspense, useState, useEffect, useCallback } from "react";
import { Vector3 } from "three";
import StickMan, { Cat } from "../character";
import { ThirdPersonCamera, FirstPersonCamera } from "../camera";
import DynamicLighting from "./DynamicLighting";
import UniversityModel from "./UniversityModel";
import { InteractionButton } from "../ui";
import { renderDynamicCollisionBoxes } from "./DynamicCollisionSystem";
import CollisionHelper, { PreviewCollisionBox } from "./CollisionHelper";
import CheckpointHelper, { PreviewCheckpointBox } from "./CheckpointHelper";

// Collision boxes cho thành phố (đơn giản)
const cityCollisionBoxes = [
  // Trường đại học - tạo collision box xung quanh
  {
    min: new Vector3(16.0, -5.2, 23.5),
    max: new Vector3(16.5, 2.8, 32.4),
    name: "tường",
    type: "wall",
  },
  {
    min: new Vector3(21.7, -5.2, -9.8),
    max: new Vector3(22.2, 2.8, 10.2),
    name: "tường",
    type: "wall",
  },
  {
    min: new Vector3(15.9, -5.2, -32.2),
    max: new Vector3(16.4, 2.8, -23.6),
    name: "tường",
    type: "wall",
  },
  {
    min: new Vector3(11.9, -5.2, -24.9),
    max: new Vector3(12.4, 2.8, -9.9),
    name: "tường",
    type: "wall",
  },
  {
    min: new Vector3(11.9, -5.2, -24.9),
    max: new Vector3(12.4, 2.8, -9.9),
    name: "tường",
    type: "wall",
  },
  {
    min: new Vector3(-12.3, -5.2, -26.7),
    max: new Vector3(-11.8, 2.8, 31.8),
    name: "tường",
    type: "wall",
  },
];

// Checkpoint tại cổng trường đại học
const universityEntrance = {
  min: { x: -2, y: -1.6, z: 6 },
  max: { x: 2, y: 0, z: 10 },
  type: "university_entrance",
  name: "Cổng trường đại học",
};

interface CitySceneProps {
  onEnterClassroom: () => void;
}

export default function CityScene({ onEnterClassroom }: CitySceneProps) {
  const [stickmanPosition, setStickmanPosition] = useState(
    new Vector3(0, -1.5, 15)
  );
  const [stickmanRotation, setStickmanRotation] = useState(0);
  const [isStickmanMoving, setIsStickmanMoving] = useState(false);
  const [cameraMode, setCameraMode] = useState<
    "first-person" | "third-person" | "free"
  >("third-person");
  const [nearUniversityEntrance, setNearUniversityEntrance] = useState(false);

  // Debug UI control
  const [showDebugInfo, setShowDebugInfo] = useState(true);

  // Debug collision boxes
  const [showCollisionBoxes, setShowCollisionBoxes] = useState(false);

  // Preview collision box state
  const [showPreviewBox, setShowPreviewBox] = useState(true);
  const [previewBoxSize, setPreviewBoxSize] = useState({
    width: 2,
    height: 2,
    depth: 2,
  });

  // Checkpoint system states
  const [showCheckpointBoxes, setShowCheckpointBoxes] = useState(false);
  const [showCheckpointPreview, setShowCheckpointPreview] = useState(false);
  const [checkpointPreviewSize, setCheckpointPreviewSize] = useState({
    width: 1,
    height: 2,
    depth: 1,
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

  // Kiểm tra khi stickman đến gần cổng trường
  useEffect(() => {
    const distance = stickmanPosition.distanceTo(
      new Vector3(
        (universityEntrance.min.x + universityEntrance.max.x) / 2,
        (universityEntrance.min.y + universityEntrance.max.y) / 2,
        (universityEntrance.min.z + universityEntrance.max.z) / 2
      )
    );

    setNearUniversityEntrance(distance < 3);
  }, [stickmanPosition]);

  // Xử lý khi nhấn nút vào trường
  const handleEnterUniversity = useCallback(() => {
    onEnterClassroom();
  }, [onEnterClassroom]);

  // Xử lý thay đổi camera mode
  const cycleCameraMode = () => {
    setCameraMode((prev) => {
      if (prev === "third-person") return "first-person";
      if (prev === "first-person") return "free";
      return "third-person";
    });
  };

  // Add checkpoint handler for debug
  const handleAddCheckpoint = () => {
    // In a real app, you would save this to a database or state management
    console.log("Adding checkpoint at:", stickmanPosition);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case "KeyC":
          cycleCameraMode();
          break;
        case "KeyE":
          if (nearUniversityEntrance) {
            handleEnterUniversity();
          }
          break;
        case "KeyF1":
          setShowDebugInfo(!showDebugInfo);
          break;
        case "KeyF2":
          setShowCollisionBoxes(!showCollisionBoxes);
          break;
        case "KeyF3":
          setShowCheckpointBoxes(!showCheckpointBoxes);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    nearUniversityEntrance,
    handleEnterUniversity,
    showDebugInfo,
    showCollisionBoxes,
    showCheckpointBoxes,
  ]);

  return (
    <div className="w-full h-screen relative">
      <Canvas
        camera={{ position: [0, 8, 20], fov: 50 }}
        shadows
        style={{ background: "linear-gradient(to bottom, #87CEEB, #98FB98)" }}
      >
        <Suspense
          fallback={
            <mesh>
              <boxGeometry args={[1, 1, 1]} />
              <meshBasicMaterial color="gray" />
            </mesh>
          }
        >
          {/* Lighting */}
          <DynamicLighting />
          <Environment preset="city" />

          {/* Trường đại học */}
          <UniversityModel scale={2} position={[0, 2.1, 0]} />

          {/* Mặt đất đơn giản */}
          <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[100, 100]} />
            <meshLambertMaterial color="#90EE90" />
          </mesh>

          {/* Stickman */}
          <StickMan
            position={[
              stickmanPosition.x,
              stickmanPosition.y,
              stickmanPosition.z,
            ]}
            onPositionChange={handleStickmanPositionChange}
            initialRotation={stickmanRotation}
            visible={true}
            scale={0.9}
            moveSpeed={18}
          />

          {/* Random Walking Cat */}
          <Cat position={[0, 0, 15]} scale={1} />

          {/* Camera System */}
          {cameraMode === "third-person" && (
            <ThirdPersonCamera
              target={stickmanPosition}
              targetRotation={stickmanRotation}
              distance={15}
              height={6}
              isMoving={isStickmanMoving}
            />
          )}
          {cameraMode === "first-person" && (
            <FirstPersonCamera
              target={stickmanPosition}
              targetRotation={stickmanRotation}
              eyeHeight={5}
              isMoving={isStickmanMoving}
            />
          )}
          {cameraMode === "free" && <OrbitControls enablePan={false} />}

          {/* Collision boxes visualization (dev mode) */}
          {process.env.NODE_ENV === "development" && (
            <>
              {cityCollisionBoxes.map((box, index) => (
                <mesh
                  key={index}
                  position={[
                    (box.min.x + box.max.x) / 2,
                    (box.min.y + box.max.y) / 2,
                    (box.min.z + box.max.z) / 2,
                  ]}
                >
                  <boxGeometry
                    args={[
                      box.max.x - box.min.x,
                      box.max.y - box.min.y,
                      box.max.z - box.min.z,
                    ]}
                  />
                  <meshBasicMaterial color="red" wireframe opacity={0.3} />
                </mesh>
              ))}

              {/* Dynamic collision visualization */}
              {renderDynamicCollisionBoxes()}
              {/* University entrance box */}
              <mesh
                position={[
                  (universityEntrance.min.x + universityEntrance.max.x) / 2,
                  (universityEntrance.min.y + universityEntrance.max.y) / 2,
                  (universityEntrance.min.z + universityEntrance.max.z) / 2,
                ]}
              >
                <boxGeometry
                  args={[
                    universityEntrance.max.x - universityEntrance.min.x,
                    universityEntrance.max.y - universityEntrance.min.y,
                    universityEntrance.max.z - universityEntrance.min.z,
                  ]}
                />
                <meshBasicMaterial color="blue" wireframe opacity={0.3} />
              </mesh>
            </>
          )}

          {/* Collision boxes visualization with debug control */}
          {showCollisionBoxes && (
            <>
              {cityCollisionBoxes.map((box, index) => (
                <mesh
                  key={`collision-${index}`}
                  position={[
                    (box.min.x + box.max.x) / 2,
                    (box.min.y + box.max.y) / 2,
                    (box.min.z + box.max.z) / 2,
                  ]}
                >
                  <boxGeometry
                    args={[
                      box.max.x - box.min.x,
                      box.max.y - box.min.y,
                      box.max.z - box.min.z,
                    ]}
                  />
                  <meshBasicMaterial
                    color="red"
                    wireframe
                    transparent
                    opacity={0.5}
                  />
                </mesh>
              ))}

              {/* Dynamic collision visualization */}
              {renderDynamicCollisionBoxes()}
            </>
          )}

          {/* Checkpoint boxes visualization */}
          {showCheckpointBoxes && (
            <mesh
              position={[
                (universityEntrance.min.x + universityEntrance.max.x) / 2,
                (universityEntrance.min.y + universityEntrance.max.y) / 2,
                (universityEntrance.min.z + universityEntrance.max.z) / 2,
              ]}
            >
              <boxGeometry
                args={[
                  universityEntrance.max.x - universityEntrance.min.x,
                  universityEntrance.max.y - universityEntrance.min.y,
                  universityEntrance.max.z - universityEntrance.min.z,
                ]}
              />
              <meshBasicMaterial
                color="blue"
                wireframe
                transparent
                opacity={0.7}
              />
            </mesh>
          )}

          {/* Preview collision box */}
          {showPreviewBox && (
            <PreviewCollisionBox
              position={stickmanPosition}
              size={previewBoxSize}
            />
          )}

          {/* Preview checkpoint box */}
          {showCheckpointPreview && (
            <PreviewCheckpointBox
              position={stickmanPosition}
              size={checkpointPreviewSize}
              type="custom"
            />
          )}
        </Suspense>
      </Canvas>

      {/* Debug Toggle Button */}
      <button
        onClick={() => setShowDebugInfo(!showDebugInfo)}
        className="absolute top-4 left-4 z-20 bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-lg shadow-lg transition-colors"
        title={showDebugInfo ? "Ẩn Debug Info" : "Hiện Debug Info"}
      >
        {showDebugInfo ? "🔍 Ẩn Debug" : "🔍 Hiện Debug"}
      </button>

      {/* Debug UI Controls */}
      {showDebugInfo && (
        <div className="absolute top-16 left-4 z-10 bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg max-w-sm">
          <h2 className="text-lg font-bold text-gray-800 mb-3">
            🎮 Điều khiển - Thành phố
          </h2>

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
                <strong>Điều khiển:</strong>
                <div className="text-xs mt-1 mb-2">
                  • <kbd className="bg-gray-200 px-1 rounded">C</kbd>: Đổi
                  camera
                  <br />• <kbd className="bg-gray-200 px-1 rounded">E</kbd>: Vào
                  trường
                  <br />• <kbd className="bg-gray-200 px-1 rounded">F1</kbd>:
                  Debug
                  <br />• <kbd className="bg-gray-200 px-1 rounded">F2</kbd>:
                  Collision
                  <br />• <kbd className="bg-gray-200 px-1 rounded">F3</kbd>:
                  Checkpoint
                </div>
              </div>
            </div>

            {/* Debug Section */}
            <div className="border-t pt-2 mt-3">
              <strong>Debug Tools:</strong>
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

                <button
                  onClick={() => setShowCheckpointBoxes(!showCheckpointBoxes)}
                  className={`w-full px-2 py-1 text-xs rounded transition-colors ${
                    showCheckpointBoxes
                      ? "bg-blue-500 text-white hover:bg-blue-600"
                      : "bg-gray-500 text-white hover:bg-gray-600"
                  }`}
                >
                  {showCheckpointBoxes
                    ? "Ẩn University Entrance"
                    : "Hiện University Entrance"}
                </button>

                <button
                  onClick={() =>
                    setShowCheckpointPreview(!showCheckpointPreview)
                  }
                  className={`w-full px-2 py-1 text-xs rounded transition-colors ${
                    showCheckpointPreview
                      ? "bg-purple-800 text-white hover:bg-purple-900"
                      : "bg-gray-500 text-white hover:bg-gray-600"
                  }`}
                >
                  {showCheckpointPreview
                    ? "Ẩn Checkpoint Preview"
                    : "Hiện Checkpoint Preview"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Collision Helper */}
      {showDebugInfo && (
        <CollisionHelper
          characterPosition={stickmanPosition}
          onPreviewSizeChange={setPreviewBoxSize}
        />
      )}

      {/* Checkpoint Helper */}
      {showDebugInfo && (
        <CheckpointHelper
          characterPosition={stickmanPosition}
          onAddCheckpoint={handleAddCheckpoint}
          onPreviewSizeChange={(size) => {
            setCheckpointPreviewSize(size);
          }}
        />
      )}

      {/* Debug Info Display */}
      {showDebugInfo && process.env.NODE_ENV === "development" && (
        <div className="fixed bottom-4 right-4 z-30 bg-black/80 text-white p-2 rounded text-xs space-y-1">
          <div>Near University: {nearUniversityEntrance ? "Yes" : "No"}</div>
          <div>Camera Mode: {cameraMode}</div>
          <div>
            Player Position: ({stickmanPosition.x.toFixed(1)},{" "}
            {stickmanPosition.y.toFixed(1)}, {stickmanPosition.z.toFixed(1)})
          </div>
          <div>
            Player Rotation: {((stickmanRotation * 180) / Math.PI).toFixed(1)}°
          </div>
          <div>Moving: {isStickmanMoving ? "Yes" : "No"}</div>
        </div>
      )}

      {/* UI Controls */}
      <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
        <h2 className="text-lg font-bold text-gray-800">
          🏙️ Thành phố thu nhỏ
        </h2>
        <p className="text-xs text-gray-600 mt-1">
          WASD: Di chuyển | C: Đổi camera
        </p>
        <p className="text-xs text-blue-600 mt-1">
          Đi đến cổng trường đại học để vào lớp học
        </p>
        <p className="text-xs text-gray-500 mt-1">
          🐱 Có một chú mèo đi lại trong thành phố
        </p>
      </div>

      {/* Original UI - only show when debug is disabled */}
      {!showDebugInfo && (
        <div className="absolute top-16 left-4 z-10 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <h2 className="text-lg font-bold text-gray-800">
            🏙️ Thành phố thu nhỏ
          </h2>
          <p className="text-xs text-gray-600 mt-1">
            WASD: Di chuyển | C: Đổi camera
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Đi đến cổng trường đại học để vào lớp học
          </p>
          <p className="text-xs text-gray-500 mt-1">
            🐱 Có một chú mèo đi lại trong thành phố
          </p>
        </div>
      )}

      {/* Camera mode indicator */}
      <div className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
        <p className="text-sm font-medium text-gray-800">
          📹{" "}
          {cameraMode === "third-person"
            ? "Góc nhìn thứ 3"
            : cameraMode === "first-person"
            ? "Góc nhìn thứ 1"
            : "Tự do"}
        </p>
      </div>

      {/* Interaction button */}
      {nearUniversityEntrance && (
        <InteractionButton
          visible={true}
          checkpointType="university"
          checkpointName="Vào trường đại học"
          onInteract={handleEnterUniversity}
          keyboardKey="E"
        />
      )}
    </div>
  );
}
