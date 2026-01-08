"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import { Group, Vector3, AnimationClip } from "three";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils";
import {
  findNearestValidPosition,
  calculateHeight,
} from "../scene/CollisionSystem";
import {
  registerDynamicObject,
  unregisterDynamicObject,
  updateDynamicObjectPosition,
  findValidPositionAvoidingDynamic,
} from "../scene/DynamicCollisionSystem";

interface StickManProps {
  position?: [number, number, number];
  scale?: number;
  visible?: boolean;
  disabled?: boolean; // Vô hiệu hóa di chuyển khi đang ngồi
  initialRotation?: number; // Rotation khởi tạo
  moveSpeed?: number; // Tốc độ di chuyển (mặc định 8)
  onPositionChange?: (
    position: Vector3,
    rotation: number,
    isMoving: boolean
  ) => void;
}

interface KeysPressed {
  [key: string]: boolean;
}

// Function to remove root motion from animation clips
function removeRootMotion(
  clip: AnimationClip,
  boneName: string = "mixamorigHips"
) {
  clip.tracks = clip.tracks.filter((track) => {
    return !track.name.includes(`${boneName}.position`);
  });
}

export default function StickMan({
  position = [0, 0, 0],
  scale = 1,
  visible = true,
  disabled = false,
  initialRotation = 0,
  moveSpeed = 8,
  onPositionChange,
}: StickManProps) {
  const group = useRef<Group>(null);
  const idleGroup = useRef<Group>(null);
  const walkingGroup = useRef<Group>(null);
  const runningGroup = useRef<Group>(null);

  // Load tất cả animation models
  const idleModel = useGLTF("/animation/idle.glb");
  const walkingModel = useGLTF("/animation/walking.glb");
  const runningModel = useGLTF("/animation/running.glb");

  // Clone scenes để mỗi StickMan có instance riêng (tránh share skeleton/material)
  const clonedScenes = useMemo(() => {
    return {
      idle: SkeletonUtils.clone(idleModel.scene) as Group,
      walking: SkeletonUtils.clone(walkingModel.scene) as Group,
      running: SkeletonUtils.clone(runningModel.scene) as Group,
    };
  }, [idleModel.scene, walkingModel.scene, runningModel.scene]);

  // Process animations (CLONE clips) để remove root motion cho walking và running
  const processedWalkingAnimations = useMemo(() => {
    if (!walkingModel.animations.length) return [];
    return walkingModel.animations.map((clip) => {
      const clonedClip = clip.clone();
      removeRootMotion(clonedClip, "mixamorigHips");
      return clonedClip;
    });
  }, [walkingModel.animations]);

  const processedRunningAnimations = useMemo(() => {
    if (!runningModel.animations.length) return [];
    return runningModel.animations.map((clip) => {
      const clonedClip = clip.clone();
      removeRootMotion(clonedClip, "mixamorigHips");
      return clonedClip;
    });
  }, [runningModel.animations]);

  const clonedIdleAnimations = useMemo(() => {
    if (!idleModel.animations.length) return [];
    return idleModel.animations.map((clip) => clip.clone());
  }, [idleModel.animations]);

  // Sử dụng animations cho từng model với ref riêng biệt
  const { actions: idleActions, names: idleNames } = useAnimations(
    clonedIdleAnimations,
    idleGroup
  );
  const { actions: walkingActions, names: walkingNames } = useAnimations(
    processedWalkingAnimations,
    walkingGroup
  );
  const { actions: runningActions, names: runningNames } = useAnimations(
    processedRunningAnimations,
    runningGroup
  );

  const keysPressed = useRef<KeysPressed>({});
  const moveDirection = useRef(new Vector3());

  // Current logical position (ground level)
  const currentPosition = useRef(new Vector3(position[0], -1.2, position[2]));
  const currentRotation = useRef(initialRotation);
  const rotationSpeed = 3; // Tốc độ quay

  // Player collision properties
  const playerId = "stickman-player";
  const playerRadius = 0.5;

  // Animation state
  const [isWalking, setIsWalking] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  // Animation names mapping
  const animationNames = useMemo(() => {
    return {
      idle: idleNames.length > 0 ? idleNames[0] : null,
      walk: walkingNames.length > 0 ? walkingNames[0] : null,
      run: runningNames.length > 0 ? runningNames[0] : null,
    };
  }, [idleNames, walkingNames, runningNames]);

  // Keyboard event listeners
  useMemo(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      keysPressed.current[event.code] = true;
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      keysPressed.current[event.code] = false;
    };

    if (typeof window !== "undefined") {
      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("keyup", handleKeyUp);

      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("keyup", handleKeyUp);
      };
    }
  }, []);

  // Animation switching logic
  useEffect(() => {
    // Stop all animations first
    if (idleActions && animationNames.idle) {
      const idleAction = idleActions[animationNames.idle];
      if (idleAction) {
        idleAction.stop();
      }
    }
    if (walkingActions && animationNames.walk) {
      const walkAction = walkingActions[animationNames.walk];
      if (walkAction) {
        walkAction.stop();
      }
    }
    if (runningActions && animationNames.run) {
      const runAction = runningActions[animationNames.run];
      if (runAction) {
        runAction.stop();
      }
    }

    // Play appropriate animation
    if (isRunning) {
      // Play running animation
      if (runningActions && animationNames.run) {
        const runAction = runningActions[animationNames.run];
        if (runAction) {
          runAction.reset().play();
        }
      }
    } else if (isWalking) {
      // Play walking animation
      if (walkingActions && animationNames.walk) {
        const walkAction = walkingActions[animationNames.walk];
        if (walkAction) {
          walkAction.reset().play();
        }
      }
    } else {
      // Play idle animation
      if (idleActions && animationNames.idle) {
        const idleAction = idleActions[animationNames.idle];
        if (idleAction) {
          idleAction.reset().play();
        }
      }
    }
  }, [
    isWalking,
    isRunning,
    idleActions,
    walkingActions,
    runningActions,
    animationNames,
  ]);

  // Khởi tạo idle animation khi component mount
  useEffect(() => {
    if (idleActions && animationNames.idle && !isWalking && !isRunning) {
      const idleAction = idleActions[animationNames.idle];
      if (idleAction) {
        idleAction.play();
      }
    }
  }, [idleActions, animationNames.idle, isWalking, isRunning]);

  // Set initial rotation for group
  useEffect(() => {
    if (group.current) {
      group.current.rotation.y = initialRotation;
    }
  }, [initialRotation]);

  // Register player in dynamic collision system
  useEffect(() => {
    registerDynamicObject({
      id: playerId,
      position: currentPosition.current,
      radius: playerRadius,
      type: "player",
    });

    // Cleanup when component unmounts
    return () => {
      unregisterDynamicObject(playerId);
    };
  }, [playerId, playerRadius]);

  useFrame((state, delta) => {
    if (!group.current) return;

    const speed = moveSpeed;
    const keys = keysPressed.current;
    let isMoving = false;

    // Skip movement input if disabled (sitting mode)
    if (disabled) {
      // Still update animation state to idle when disabled
      if (isWalking !== false) {
        setIsWalking(false);
      }
      if (isRunning !== false) {
        setIsRunning(false);
      }
      return;
    }

    // Reset movement direction
    moveDirection.current.set(0, 0, 0);

    // Handle rotation (A/D quay trái/phải)
    if (keys["KeyA"] || keys["ArrowLeft"]) {
      currentRotation.current += rotationSpeed * delta;
      group.current.rotation.y = currentRotation.current;
    }
    if (keys["KeyD"] || keys["ArrowRight"]) {
      currentRotation.current -= rotationSpeed * delta;
      group.current.rotation.y = currentRotation.current;
    }

    // Handle forward/backward movement relative to character rotation
    if (keys["KeyW"] || keys["ArrowUp"]) {
      // Di chuyển thẳng theo hướng nhân vật đang quay mặt
      moveDirection.current.z = 1; // Local forward direction
      isMoving = true;
    }
    if (keys["KeyS"] || keys["ArrowDown"]) {
      // Di chuyển lùi
      moveDirection.current.z = -1; // Local backward direction
      isMoving = true;
    }

    // Cập nhật animation state dựa trên tốc độ và movement
    const shouldBeRunning = isMoving && moveSpeed > 15;
    const shouldBeWalking = isMoving && moveSpeed <= 15;

    // Cập nhật animation state chỉ khi cần thiết
    if (isRunning !== shouldBeRunning) {
      setIsRunning(shouldBeRunning);
    }
    if (isWalking !== shouldBeWalking) {
      setIsWalking(shouldBeWalking);
    }

    // Apply movement relative to character rotation with collision detection
    if (isMoving) {
      // Convert local movement direction to world space
      const worldDirection = new Vector3();
      worldDirection.copy(moveDirection.current);
      worldDirection.applyAxisAngle(
        new Vector3(0, 1, 0),
        currentRotation.current
      );

      // Calculate target position
      const movement = worldDirection.multiplyScalar(speed * delta);
      const targetPosition = currentPosition.current.clone();
      targetPosition.x += movement.x;
      targetPosition.z += movement.z;
      // Y position sẽ được tính toán bởi height zones

      // Check collision with static objects (walls, furniture)
      const staticValidPosition = findNearestValidPosition(
        targetPosition,
        currentPosition.current,
        playerRadius
      );

      // Check collision with dynamic objects (cat, other NPCs)
      const finalValidPosition = findValidPositionAvoidingDynamic(
        staticValidPosition,
        currentPosition.current,
        playerRadius,
        playerId
      );

      // Update position only if different from current
      if (!finalValidPosition.equals(currentPosition.current)) {
        currentPosition.current.copy(finalValidPosition);

        // Update position in dynamic collision system
        updateDynamicObjectPosition(playerId, currentPosition.current);
      }
    }

    // Always update display position based on current logical position and height zones
    const currentHeight = calculateHeight(currentPosition.current);
    const displayPosition = new Vector3(
      currentPosition.current.x,
      currentHeight + 1.2, // Add display offset
      currentPosition.current.z
    );

    if (group.current) {
      group.current.position.copy(displayPosition);
    }

    // Notify parent of position change, rotation and movement state for camera following
    if (onPositionChange) {
      onPositionChange(
        currentPosition.current,
        currentRotation.current,
        isMoving
      );
    }
  });

  return (
    <group
      ref={group}
      position={[position[0], position[1] - 1.2, position[2]]}
      visible={visible}
    >
      {/* Hiển thị idle model với Y offset riêng */}
      {!isWalking && !isRunning && (
        <group ref={idleGroup} position={[0, 0.1, 0]}>
          <primitive object={clonedScenes.idle} scale={scale} dispose={null} />
        </group>
      )}

      {/* Hiển thị walking model với Y offset riêng */}
      {isWalking && !isRunning && (
        <group ref={walkingGroup} position={[0, -1.2, 0]}>
          <primitive
            object={clonedScenes.walking}
            scale={scale}
            dispose={null}
          />
        </group>
      )}

      {/* Hiển thị running model với Y offset riêng */}
      {isRunning && (
        <group ref={runningGroup} position={[0, -1.2, 0]}>
          <primitive
            object={clonedScenes.running}
            scale={scale}
            dispose={null}
          />
        </group>
      )}
    </group>
  );
}

// Preload tất cả animation models
useGLTF.preload("/animation/idle.glb");
useGLTF.preload("/animation/walking.glb");
useGLTF.preload("/animation/running.glb");
