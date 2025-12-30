"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment } from "@react-three/drei";
import { Suspense, useState, useEffect, useCallback, useRef } from "react";
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
import { useQuery } from "@tanstack/react-query";
import { attendanceApi } from "@/api/attendance-api";
import { loadProgress } from "@/utils/lesson-progress";
import Confetti from "react-confetti";

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

  // Fetch daily state to check lesson completion
  const { data: dailyState } = useQuery({
    queryKey: ["daily-state"],
    queryFn: () => attendanceApi.getStatus(),
  });

  // Check if all lessons are completed
  const [isAllLessonsCompleted, setIsAllLessonsCompleted] = useState(false);
  const [lessonStats, setLessonStats] = useState<{
    vocabCount: number;
    kanjiCount: number;
    grammarCount: number;
  }>({ vocabCount: 0, kanjiCount: 0, grammarCount: 0 });

  // Confetti state
  const [showConfetti, setShowConfetti] = useState(false);
  const completionCardRef = useRef<HTMLDivElement>(null);
  const [cardDimensions, setCardDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [hasShownConfettiForThisSession, setHasShownConfettiForThisSession] =
    useState(false);

  useEffect(() => {
    if (!dailyState?.checkedInAt) {
      setIsAllLessonsCompleted(false);
      return;
    }

    const checkedInDate = new Date(dailyState.checkedInAt);
    const dateKey = checkedInDate.toISOString().split("T")[0];

    // Load progress for all lessons
    const vocabProgress = loadProgress("vocab", dateKey);
    const kanjiProgress = loadProgress("kanji", dateKey);
    const grammarProgress = loadProgress("grammar", dateKey);

    // Get total counts
    const vocabCount = dailyState.assigned.vocabIds?.length || 0;
    const kanjiCount = dailyState.assigned.kanjiIds?.length || 0;
    const grammarCount = dailyState.assigned.grammarIds?.length || 0;

    // Calculate progress for each lesson (completedIndices.length / total * 100)
    const vocabProgressPercent =
      vocabCount > 0 && vocabProgress?.completedIndices
        ? (vocabProgress.completedIndices.length / vocabCount) * 100
        : 0;
    const kanjiProgressPercent =
      kanjiCount > 0 && kanjiProgress?.completedIndices
        ? (kanjiProgress.completedIndices.length / kanjiCount) * 100
        : 0;
    const grammarProgressPercent =
      grammarCount > 0 && grammarProgress?.completedIndices
        ? (grammarProgress.completedIndices.length / grammarCount) * 100
        : 0;

    // Check if all lessons are completed (progress >= 100% and test passed)
    const vocabCompleted =
      vocabCount > 0 &&
      vocabProgressPercent >= 100 &&
      vocabProgress?.testPassed === true;
    const kanjiCompleted =
      kanjiCount > 0 &&
      kanjiProgressPercent >= 100 &&
      kanjiProgress?.testPassed === true;
    const grammarCompleted =
      grammarCount > 0 &&
      grammarProgressPercent >= 100 &&
      grammarProgress?.testPassed === true;

    // All lessons are completed if:
    // - All assigned lessons have progress >= 100% and test passed
    // - At least one lesson type has items assigned
    const hasAnyLessons = vocabCount > 0 || kanjiCount > 0 || grammarCount > 0;
    const allCompleted =
      hasAnyLessons &&
      (vocabCount === 0 || vocabCompleted) &&
      (kanjiCount === 0 || kanjiCompleted) &&
      (grammarCount === 0 || grammarCompleted);

    setIsAllLessonsCompleted(allCompleted);

    // Set lesson stats
    setLessonStats({
      vocabCount,
      kanjiCount,
      grammarCount,
    });
  }, [dailyState, isAllLessonsCompleted]);

  // Get card dimensions and trigger confetti when card appears
  useEffect(() => {
    const updateCardDimensions = () => {
      if (completionCardRef.current) {
        const rect = completionCardRef.current.getBoundingClientRect();
        setCardDimensions({
          width: rect.width,
          height: rect.height,
        });
      }
    };

    if (isSitting && isAllLessonsCompleted && completionCardRef.current) {
      // Update dimensions
      updateCardDimensions();

      // Trigger confetti when card first appears (when sitting down)
      if (!hasShownConfettiForThisSession) {
        // Small delay to ensure card is rendered
        setTimeout(() => {
          setShowConfetti(true);
          setHasShownConfettiForThisSession(true);

          // Hide confetti after 5 seconds
          setTimeout(() => {
            setShowConfetti(false);
          }, 5000);
        }, 100);
      }

      // Update on resize
      window.addEventListener("resize", updateCardDimensions);
      return () => window.removeEventListener("resize", updateCardDimensions);
    } else if (!isSitting) {
      // Reset confetti state when standing up
      setHasShownConfettiForThisSession(false);
      setShowConfetti(false);
    }
  }, [isSitting, isAllLessonsCompleted, hasShownConfettiForThisSession]);

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
      <div className="absolute top-4 left-4 z-[60]">
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

          {/* Lesson Button or Completion Message */}
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
            {isAllLessonsCompleted ? (
              <div
                ref={completionCardRef}
                className="bg-gradient-to-br from-yellow-50 via-orange-50 to-pink-50 rounded-3xl shadow-2xl p-8 max-w-lg text-center relative overflow-hidden"
              >
                {/* Confetti Effect - Only inside this div */}
                {showConfetti && cardDimensions.width > 0 && (
                  <Confetti
                    width={cardDimensions.width}
                    height={cardDimensions.height}
                    recycle={false}
                    numberOfPieces={200}
                    gravity={0.3}
                    initialVelocityY={15}
                    colors={[
                      "#FF6B6B",
                      "#4ECDC4",
                      "#45B7D1",
                      "#96CEB4",
                      "#FFEAA7",
                      "#DDA0DD",
                      "#98D8C8",
                      "#F7DC6F",
                      "#BB8FCE",
                      "#85C1E9",
                    ]}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      zIndex: 10,
                      pointerEvents: "none",
                    }}
                  />
                )}

                {/* Confetti background pattern */}
                <div className="absolute inset-0 opacity-20 z-0">
                  <div className="absolute top-4 left-8 w-3 h-3 bg-blue-400 rounded transform rotate-45"></div>
                  <div className="absolute top-12 right-12 w-2 h-4 bg-red-400 rounded"></div>
                  <div className="absolute top-20 left-16 w-4 h-2 bg-yellow-400 rounded"></div>
                  <div className="absolute bottom-16 right-8 w-3 h-3 bg-green-400 rounded transform rotate-45"></div>
                  <div className="absolute bottom-8 left-12 w-2 h-4 bg-purple-400 rounded"></div>
                  <div className="absolute top-6 right-20 w-4 h-2 bg-pink-400 rounded"></div>
                </div>

                {/* Party horn icon */}
                <div className="text-7xl mb-4 relative z-10">🎉</div>

                <h3 className="text-3xl font-bold text-gray-800 mb-6 relative z-10">
                  Đã hoàn thành bài học
                  <br />
                  hôm nay!
                </h3>

                {/* Lesson stats cards */}
                <div className="grid grid-cols-3 gap-3 mb-8 relative z-10">
                  {lessonStats.vocabCount > 0 && (
                    <div className="bg-blue-100 rounded-2xl p-4 text-center">
                      <div className="text-3xl mb-2">📚</div>
                      <div className="text-sm font-medium text-gray-700 mb-1">
                        TỪ VỰNG:
                      </div>
                      <div className="text-xl font-bold text-blue-600">
                        {lessonStats.vocabCount} từ
                      </div>
                    </div>
                  )}
                  {lessonStats.kanjiCount > 0 && (
                    <div className="bg-green-100 rounded-2xl p-4 text-center">
                      <div className="text-3xl mb-2">✍️</div>
                      <div className="text-sm font-medium text-gray-700 mb-1">
                        KANJI:
                      </div>
                      <div className="text-xl font-bold text-green-600">
                        {lessonStats.kanjiCount} từ
                      </div>
                    </div>
                  )}
                  {lessonStats.grammarCount > 0 && (
                    <div className="bg-purple-100 rounded-2xl p-4 text-center">
                      <div className="text-3xl mb-2">📖</div>
                      <div className="text-sm font-medium text-gray-700 mb-1">
                        NGỮ PHÁP:
                      </div>
                      <div className="text-xl font-bold text-purple-600">
                        {lessonStats.grammarCount} mẫu
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setShowLessonModal(true)}
                  className="w-full px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-lg font-semibold rounded-2xl shadow-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2 relative z-10 cursor-pointer"
                >
                  📖 Xem lại bài học
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLessonModal(true)}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-lg font-semibold rounded-xl shadow-2xl transition-all transform hover:scale-105 cursor-pointer"
              >
                🎓 Bắt đầu bài học hôm nay
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Preload the classroom model
useGLTF.preload("/3d_source/main_classroom.glb");
