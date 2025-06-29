"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment } from "@react-three/drei";
import { Suspense, useState, useEffect, useCallback } from "react";
import { Vector3 } from "three";
import StickMan, { Teacher } from "../character";
import { ThirdPersonCamera, FirstPersonCamera } from "../camera";
import DynamicLighting from "./DynamicLighting";
import TimeDisplay from "../ui";
import { renderCollisionBoxes } from "./CollisionSystem";
import CollisionHelper, { PreviewCollisionBox } from "./CollisionHelper";
import {
  findNearbyCheckpoint,
  renderCheckpointBoxes,
  Checkpoint,
} from "./CheckpointSystem";
import CheckpointHelper, { PreviewCheckpointBox } from "./CheckpointHelper";
import { NotificationSystem, useNotifications, InteractionButton } from "../ui";

interface ClassroomModelProps {
  position?: [number, number, number];
  scale?: number;
}

function ClassroomModel({
  position = [0, 0, 0],
  scale = 3,
}: ClassroomModelProps) {
  const { scene } = useGLTF("/3d_source/main_classroom.glb");

  return <primitive object={scene} position={position} scale={scale} />;
}

export default function ClassroomScene() {
  const [stickmanPosition, setStickmanPosition] = useState(
    new Vector3(-3.0, -1.2, 1.2)
  );
  const [stickmanRotation, setStickmanRotation] = useState(Math.PI);
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

  // Checkpoint system states
  const [showCheckpointBoxes, setShowCheckpointBoxes] = useState(false);
  const [showCheckpointPreview, setShowCheckpointPreview] = useState(false);
  const [checkpointPreviewSize, setCheckpointPreviewSize] = useState({
    width: 1,
    height: 2,
    depth: 1,
  });
  const [checkpointType, setCheckpointType] = useState<
    "seat" | "desk" | "board" | "door" | "custom"
  >("seat");

  // Notification system
  const { notifications, removeNotification } = useNotifications();

  // Sitting mode states
  const [isSitting, setIsSitting] = useState(false);
  const [currentSeatCheckpoint, setCurrentSeatCheckpoint] =
    useState<Checkpoint | null>(null);
  const [nearbyInteractable, setNearbyInteractable] =
    useState<Checkpoint | null>(null);
  const [originalPosition, setOriginalPosition] = useState<Vector3 | null>(
    null
  );
  const [originalCameraMode, setOriginalCameraMode] = useState<
    "first-person" | "third-person" | "free"
  >("third-person");
  const [sittingCameraYaw, setSittingCameraYaw] = useState(0); // Góc camera khi ngồi

  const handleStickmanPositionChange = (
    position: Vector3,
    rotation: number,
    isMoving: boolean
  ) => {
    setStickmanPosition(position.clone());
    setStickmanRotation(rotation);
    setIsStickmanMoving(isMoving);
  };

  // Check for nearby interactable seats and teacher
  useEffect(() => {
    if (isSitting) return; // Không check khi đang ngồi

    // Check for nearby interactable (always detect regardless of cooldown)
    const nearbyCheckpoint = findNearbyCheckpoint(stickmanPosition);

    // Debug log for teacher detection
    if (process.env.NODE_ENV === "development") {
      console.log(`Checkpoint detection:
        Player pos: (${stickmanPosition.x.toFixed(
          1
        )}, ${stickmanPosition.y.toFixed(1)}, ${stickmanPosition.z.toFixed(1)})
        Nearby checkpoint: ${
          nearbyCheckpoint
            ? `${nearbyCheckpoint.name} (${nearbyCheckpoint.type})`
            : "None"
        }`);
    }

    if (
      nearbyCheckpoint &&
      (nearbyCheckpoint.type === "seat" || nearbyCheckpoint.type === "teacher")
    ) {
      setNearbyInteractable(nearbyCheckpoint);
    } else {
      setNearbyInteractable(null);
    }
  }, [stickmanPosition, isSitting]);

  // Add new checkpoint handler
  const handleAddCheckpoint = (checkpoint: Checkpoint) => {
    // In a real app, you would save this to a database or state management
    console.log("New checkpoint added:", checkpoint);
  };

  // Handle teacher interaction
  const handleTeacherInteraction = useCallback(() => {
    if (!nearbyInteractable || nearbyInteractable.type !== "teacher") return;

    console.log("Talking to teacher...");
    // Add your teacher interaction logic here
    // For example: show dialog, start conversation, etc.
  }, [nearbyInteractable]);

  // Handle seat interaction
  const handleSeatInteraction = useCallback(() => {
    if (!nearbyInteractable || nearbyInteractable.type !== "seat") return;

    // Save current state
    setOriginalPosition(stickmanPosition.clone());
    setOriginalCameraMode(cameraMode);

    // Calculate seat position (center of checkpoint)
    const seatPosition = new Vector3(
      (nearbyInteractable.min.x + nearbyInteractable.max.x) / 2,
      (nearbyInteractable.min.y + nearbyInteractable.max.y) / 2,
      (nearbyInteractable.min.z + nearbyInteractable.max.z) / 2
    );

    // Reset character rotation to 0 for consistent calculation

    // Calculate camera angle to face teacher from seat position
    const teacherPosition = new Vector3(3, -0.7, -12.08);
    const direction = teacherPosition.clone().sub(seatPosition);

    // Calculate direct angle from seat to teacher (independent of character rotation)
    const directAngle = Math.atan2(direction.x, direction.z);
    const directAngleDegrees = (directAngle * 180) / Math.PI;

    // Convert to expected range based on user data
    let cameraAngleDegrees = directAngleDegrees;

    // Normalize to -360 to 0 range to match user data
    if (cameraAngleDegrees > 0) {
      cameraAngleDegrees = cameraAngleDegrees - 360;
    }

    const cameraYaw = (cameraAngleDegrees * Math.PI) / 180;

    // Debug log with comprehensive angle information
    if (process.env.NODE_ENV === "development") {
      console.log(`Seat interaction:
        Seat Position: (${seatPosition.x.toFixed(2)}, ${seatPosition.y.toFixed(
        2
      )}, ${seatPosition.z.toFixed(2)})
        Teacher Position: (${teacherPosition.x.toFixed(
          2
        )}, ${teacherPosition.y.toFixed(2)}, ${teacherPosition.z.toFixed(2)})
        Direction Vector: (${direction.x.toFixed(3)}, ${direction.z.toFixed(3)})
        Direct Angle: ${directAngleDegrees.toFixed(1)}°
        Final Camera Angle: ${cameraAngleDegrees.toFixed(
          1
        )}° (${cameraYaw.toFixed(3)} rad)`);
    }

    // Set sitting mode
    setIsSitting(true);
    setCurrentSeatCheckpoint(nearbyInteractable);
    setCameraMode("first-person");
    setSittingCameraYaw(cameraYaw); // Set camera yaw for first-person camera

    // Move character to seat position
    setStickmanPosition(seatPosition);

    // Reset character rotation to 0 for consistent camera calculation
    setStickmanRotation(0);
  }, [nearbyInteractable, stickmanPosition, cameraMode]);

  // Handle ESC key to exit sitting mode
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isSitting) {
        // Exit sitting mode
        setIsSitting(false);
        setCurrentSeatCheckpoint(null);
        setCameraMode(originalCameraMode);
        setSittingCameraYaw(0); // Reset camera yaw

        if (originalPosition) {
          setStickmanPosition(originalPosition);
          setOriginalPosition(null);
        }
      }

      // Handle F key for interaction
      if (event.key === "f" || event.key === "F") {
        if (nearbyInteractable?.type === "seat" && !isSitting) {
          handleSeatInteraction();
        } else if (nearbyInteractable?.type === "teacher") {
          handleTeacherInteraction();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isSitting,
    originalPosition,
    originalCameraMode,
    nearbyInteractable,
    stickmanPosition,
    handleSeatInteraction,
    handleTeacherInteraction,
  ]);

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

          {/* Debug: Checkpoint Boxes */}
          {showCheckpointBoxes && renderCheckpointBoxes()}

          {/* Preview Collision Box */}
          {showPreviewBox && (
            <PreviewCollisionBox
              position={stickmanPosition}
              size={previewBoxSize}
            />
          )}

          {/* Preview Checkpoint Box */}
          {showCheckpointPreview && (
            <PreviewCheckpointBox
              position={stickmanPosition}
              size={checkpointPreviewSize}
              type={checkpointType}
            />
          )}

          <StickMan
            position={[-3.0, -1.2, 1.2]}
            scale={0.9}
            visible={cameraMode !== "first-person"}
            disabled={isSitting}
            initialRotation={Math.PI}
            onPositionChange={handleStickmanPositionChange}
          />

          {/* Teacher - Static character with talk animation */}
          <Teacher
            position={[3.4, -0.7, -18.9]} // Center front of classroom
            scale={0.9}
            rotation={[0, -1.5, 0]} // Face towards students (default forward)
            playerPosition={
              nearbyInteractable?.type === "teacher"
                ? stickmanPosition
                : undefined
            }
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
              initialYaw={isSitting ? sittingCameraYaw : 0}
              isSitting={isSitting}
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

      {/* Notification System */}
      <NotificationSystem
        notifications={notifications}
        onRemoveNotification={removeNotification}
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

              <button
                onClick={() => setShowCheckpointBoxes(!showCheckpointBoxes)}
                className={`w-full px-2 py-1 text-xs rounded transition-colors ${
                  showCheckpointBoxes
                    ? "bg-purple-500 text-white hover:bg-purple-600"
                    : "bg-gray-500 text-white hover:bg-gray-600"
                }`}
              >
                {showCheckpointBoxes
                  ? "Ẩn Checkpoint Boxes"
                  : "Hiện Checkpoint Boxes"}
              </button>

              <button
                onClick={() => setShowCheckpointPreview(!showCheckpointPreview)}
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

      {/* Collision Helper */}
      <CollisionHelper
        characterPosition={stickmanPosition}
        onPreviewSizeChange={setPreviewBoxSize}
      />

      {/* Checkpoint Helper */}
      <CheckpointHelper
        characterPosition={stickmanPosition}
        onAddCheckpoint={handleAddCheckpoint}
        onPreviewSizeChange={(size) => {
          setCheckpointPreviewSize(size);
          // Also update checkpoint type if needed
          setCheckpointType("seat");
        }}
      />

      {/* Debug Info */}
      {process.env.NODE_ENV === "development" && (
        <div className="fixed bottom-4 right-4 z-30 bg-black/80 text-white p-2 rounded text-xs space-y-1">
          <div>Sitting: {isSitting ? "Yes" : "No"}</div>
          <div>
            Nearby: {nearbyInteractable ? nearbyInteractable.name : "None"}
          </div>
          <div>Type: {nearbyInteractable?.type || "None"}</div>
          <div>
            Button visible:{" "}
            {!isSitting &&
            (nearbyInteractable?.type === "seat" ||
              nearbyInteractable?.type === "teacher")
              ? "Yes"
              : "No"}
          </div>
          <div>Camera Mode: {cameraMode}</div>
          <div>
            Sitting Camera Yaw:{" "}
            {((sittingCameraYaw * 180) / Math.PI).toFixed(1)}°
          </div>
          <div>
            Player Position: ({stickmanPosition.x.toFixed(1)},{" "}
            {stickmanPosition.y.toFixed(1)}, {stickmanPosition.z.toFixed(1)})
          </div>
          <div>
            Player Rotation: {((stickmanRotation * 180) / Math.PI).toFixed(1)}°
          </div>
        </div>
      )}

      {/* Interaction Button */}
      <InteractionButton
        visible={
          !isSitting &&
          (nearbyInteractable?.type === "seat" ||
            nearbyInteractable?.type === "teacher")
        }
        checkpointType={nearbyInteractable?.type || "seat"}
        checkpointName={nearbyInteractable?.name || ""}
        onInteract={
          nearbyInteractable?.type === "teacher"
            ? handleTeacherInteraction
            : handleSeatInteraction
        }
        disabled={isSitting}
      />

      {/* Sitting mode indicator */}
      {isSitting && currentSeatCheckpoint && (
        <div className="fixed top-1/2 left-4 z-30 bg-blue-500/90 text-white p-3 rounded-lg shadow-lg">
          <div className="text-sm font-medium">
            📚 Đang ngồi tại: {currentSeatCheckpoint.name}
          </div>
          <div className="text-xs text-blue-100 mt-1">
            Nhấn <kbd className="bg-blue-600 px-1 rounded">ESC</kbd> để đứng dậy
          </div>
        </div>
      )}
    </div>
  );
}

// Preload the classroom model
useGLTF.preload("/3d_source/main_classroom.glb");
