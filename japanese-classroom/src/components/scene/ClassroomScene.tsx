"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment } from "@react-three/drei";
import { Suspense, useState, useEffect, useCallback } from "react";
import { Vector3 } from "three";
import StickMan, { Teacher } from "../character";
import { ThirdPersonCamera, FirstPersonCamera } from "../camera";
import DynamicLighting from "./DynamicLighting";
import TimeDisplay from "../ui";
import { findNearbyCheckpoint, Checkpoint } from "./CheckpointSystem";
import {
  NotificationSystem,
  useNotifications,
  InteractionButton,
  ChatDialog,
  CheckInModal,
  ConfirmDialog,
  LessonModal,
} from "../ui";
import { useRouter } from "next/navigation";

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

interface ClassroomSceneProps {
  onExitClassroom?: () => void;
}

export default function ClassroomScene({
  onExitClassroom,
}: ClassroomSceneProps) {
  const router = useRouter();
  const [stickmanPosition, setStickmanPosition] = useState(
    new Vector3(-3.0, -1.2, 1.2)
  );
  const [stickmanRotation, setStickmanRotation] = useState(Math.PI);
  const [isStickmanMoving, setIsStickmanMoving] = useState(false);
  const [cameraMode, setCameraMode] = useState<
    "first-person" | "third-person" | "free"
  >("third-person");

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

  // Chat dialog states
  const [showTeacherDialog, setShowTeacherDialog] = useState(false);
  const [isInConversation, setIsInConversation] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);

  // Exit confirmation dialog
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [hasShownExitConfirm, setHasShownExitConfirm] = useState(false);
  const [stickmanKey, setStickmanKey] = useState(0); // Key to force re-render StickMan

  // Cycle camera modes
  const cycleCameraMode = useCallback(() => {
    setCameraMode((mode) => {
      if (mode === "first-person") return "third-person";
      if (mode === "third-person") return "free";
      return "first-person";
    });
  }, []);

  const handleStickmanPositionChange = (
    position: Vector3,
    rotation: number,
    isMoving: boolean
  ) => {
    setStickmanPosition(position.clone());
    setStickmanRotation(rotation);
    setIsStickmanMoving(isMoving);
  };

  // Check for nearby interactable seats and teacher, and exit condition
  useEffect(() => {
    if (isSitting) return; // Không check khi đang ngồi
    if (showExitConfirm || isInConversation) return; // Không check khi đang show confirm hoặc đang conversation

    // Check for exit condition - if player moves far from classroom center
    const classroomCenter = new Vector3(-15, -1.2, -12);
    const distanceFromCenter = stickmanPosition.distanceTo(classroomCenter);

    // If player is too far from classroom center, show confirmation dialog
    if (distanceFromCenter > 25 && !hasShownExitConfirm) {
      setShowExitConfirm(true);
      setHasShownExitConfirm(true);
      return;
    }

    // Reset flag if player comes back close to center
    if (distanceFromCenter <= 25 && hasShownExitConfirm) {
      setHasShownExitConfirm(false);
    }

    // Check for nearby interactable (always detect regardless of cooldown)
    const nearbyCheckpoint = findNearbyCheckpoint(stickmanPosition);

    if (
      nearbyCheckpoint &&
      (nearbyCheckpoint.type === "seat" || nearbyCheckpoint.type === "teacher")
    ) {
      setNearbyInteractable(nearbyCheckpoint);
    } else {
      setNearbyInteractable(null);
    }
  }, [
    stickmanPosition,
    isSitting,
    showExitConfirm,
    isInConversation,
    hasShownExitConfirm,
  ]);

  // Handle exit confirmation
  const handleConfirmExit = useCallback(() => {
    setShowExitConfirm(false);
    if (onExitClassroom) {
      onExitClassroom();
    } else {
      router.push("/");
    }
  }, [onExitClassroom, router]);

  const handleCancelExit = useCallback(() => {
    setShowExitConfirm(false);

    // Reset player position to a safe location near classroom center
    const safePosition = new Vector3(-3.0, -1.2, 1.2); // Initial spawn position
    setStickmanPosition(safePosition);
    setStickmanRotation(Math.PI); // Reset rotation to initial value

    // Force re-render StickMan component by changing key
    setStickmanKey((prev) => prev + 1);

    // Reset camera mode if in first-person
    if (cameraMode === "first-person") {
      setCameraMode("third-person");
    }

    // Delay resetting flag to ensure position is updated first
    setTimeout(() => {
      setHasShownExitConfirm(false);
    }, 500);
  }, [cameraMode]);

  // Teacher messages
  const teacherMessages = [
    "こんにちは！日本語のクラスへようこそ！",
    "今日は何を勉強したいですか？",
    "ひらがな、カタカナ、それとも漢字ですか？",
    "頑張って勉強しましょう！",
  ];

  // Handle teacher interaction
  const handleTeacherInteraction = useCallback(() => {
    if (!nearbyInteractable || nearbyInteractable.type !== "teacher") return;

    // Save current state and enter conversation mode
    setOriginalPosition(stickmanPosition.clone());
    setOriginalCameraMode(cameraMode);
    setIsInConversation(true);

    // Teacher position (same as defined in Teacher component)
    const teacherPosition = new Vector3(3.4, -0.7, -18.9);

    // Use current position for conversation (don't move character)
    const conversationPosition = stickmanPosition.clone();

    // Calculate camera angle to face teacher from current position (similar to seat logic)
    const direction = teacherPosition.clone().sub(conversationPosition);
    const directAngle = Math.atan2(direction.x, direction.z);
    const directAngleDegrees = (directAngle * 180) / Math.PI;

    // Convert to expected range based on user data
    let cameraAngleDegrees = directAngleDegrees;

    // Normalize to -360 to 0 range to match user data
    if (cameraAngleDegrees > 0) {
      cameraAngleDegrees = cameraAngleDegrees - 360;
    }

    const cameraYaw = (cameraAngleDegrees * Math.PI) / 180;

    // Reset character rotation to 0 for consistent camera calculation
    setStickmanRotation(0);

    // Switch to first-person camera with calculated angle facing teacher
    setCameraMode("first-person");
    setSittingCameraYaw(cameraYaw); // Set camera yaw to face teacher

    // Show dialog
    setShowTeacherDialog(true);
  }, [nearbyInteractable, stickmanPosition, cameraMode]);

  // Handle closing teacher dialog
  const handleCloseTeacherDialog = useCallback(() => {
    setShowTeacherDialog(false);
    setIsInConversation(false);

    // Restore original state
    setCameraMode(originalCameraMode);
    setSittingCameraYaw(0);

    if (originalPosition) {
      setStickmanPosition(originalPosition);
      setOriginalPosition(null);
    }

    // Show check-in modal after conversation ends
    setShowCheckInModal(true);
  }, [originalCameraMode, originalPosition]);

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

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case "Escape":
          if (isSitting) {
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
          break;

        case "KeyC":
          // Cycle camera mode (only when not sitting or in conversation)
          if (!isSitting && !isInConversation) {
            cycleCameraMode();
          }
          break;

        case "KeyF":
          // Handle F key for interaction (only when not in conversation)
          if (!isInConversation) {
            if (nearbyInteractable?.type === "seat" && !isSitting) {
              handleSeatInteraction();
            } else if (nearbyInteractable?.type === "teacher") {
              handleTeacherInteraction();
            }
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isSitting,
    isInConversation,
    originalPosition,
    originalCameraMode,
    nearbyInteractable,
    stickmanPosition,
    handleSeatInteraction,
    handleTeacherInteraction,
    cycleCameraMode,
  ]);

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

          <StickMan
            key={stickmanKey}
            position={[
              stickmanPosition.x,
              stickmanPosition.y,
              stickmanPosition.z,
            ]}
            scale={0.9}
            visible={cameraMode !== "first-person"}
            disabled={isSitting || isInConversation || showExitConfirm}
            initialRotation={stickmanRotation}
            moveSpeed={8}
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
              initialYaw={isSitting || isInConversation ? sittingCameraYaw : 0}
              isSitting={isSitting || isInConversation}
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

      {/* Time Display - Top Left */}
      <div className="absolute top-4 left-4 z-10">
        <TimeDisplay />
      </div>

      {/* Notification System */}
      <NotificationSystem
        notifications={notifications}
        onRemoveNotification={removeNotification}
      />

      {/* Interaction Button */}
      <InteractionButton
        visible={
          !isSitting &&
          !isInConversation &&
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
        disabled={isSitting || isInConversation}
      />

      {/* Chat Dialog */}
      <ChatDialog
        visible={showTeacherDialog}
        speakerName="Sensei"
        messages={teacherMessages}
        onClose={handleCloseTeacherDialog}
        position={{ x: 50, y: 25 }}
      />

      {/* Check-in Modal */}
      <CheckInModal
        visible={showCheckInModal}
        onClose={() => setShowCheckInModal(false)}
      />

      {/* Lesson Modal */}
      <LessonModal
        visible={showLessonModal}
        onClose={() => setShowLessonModal(false)}
      />

      {/* Exit Confirmation Dialog */}
      <ConfirmDialog
        visible={showExitConfirm}
        title="Rời khỏi phòng học?"
        message="Bạn đang đi xa khỏi phòng học. Bạn có muốn quay trở về bản đồ chính không?"
        confirmText="Quay về bản đồ"
        cancelText="Ở lại"
        onConfirm={handleConfirmExit}
        onCancel={handleCancelExit}
      />

      {/* Sitting mode indicator and lesson button */}
      {isSitting && currentSeatCheckpoint && (
        <>
          <div className="fixed top-1/2 left-4 z-30 bg-blue-500/90 text-white p-3 rounded-lg shadow-lg">
            <div className="text-sm font-medium">
              📚 Đang ngồi tại: {currentSeatCheckpoint.name}
            </div>
            <div className="text-xs text-blue-100 mt-1">
              Nhấn <kbd className="bg-blue-600 px-1 rounded">ESC</kbd> để đứng
              dậy
            </div>
          </div>

          {/* Start Lesson Button */}
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
            <button
              onClick={() => setShowLessonModal(true)}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-lg font-semibold rounded-xl shadow-2xl transition-all transform hover:scale-105"
            >
              🎓 Bắt đầu bài học hôm nay
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// Preload the classroom model
useGLTF.preload("/3d_source/main_classroom.glb");
