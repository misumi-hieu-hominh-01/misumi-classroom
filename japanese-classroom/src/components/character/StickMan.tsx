"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import { Group, Vector3, AnimationClip } from "three";
import {
  findNearestValidPosition,
  calculateHeight,
} from "../scene/CollisionSystem";

interface StickManProps {
  position?: [number, number, number];
  scale?: number;
  visible?: boolean;
  disabled?: boolean; // Vô hiệu hóa di chuyển khi đang ngồi
  initialRotation?: number; // Rotation khởi tạo
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
  onPositionChange,
}: StickManProps) {
  const group = useRef<Group>(null);
  const idleGroup = useRef<Group>(null);
  const walkingGroup = useRef<Group>(null);

  // Load cả hai models
  const idleModel = useGLTF("/animation/idle.glb");
  const walkingModel = useGLTF("/animation/walking.glb");

  // Process animations để remove root motion cho walking model
  const processedWalkingAnimations = useMemo(() => {
    if (!walkingModel.animations.length) return walkingModel.animations;

    console.log("Processing walking animations to remove root motion...");
    walkingModel.animations.forEach((clip) => {
      removeRootMotion(clip, "mixamorigHips");
    });

    return walkingModel.animations;
  }, [walkingModel.animations]);

  // Sử dụng animations cho từng model với ref riêng biệt
  const { actions: idleActions, names: idleNames } = useAnimations(
    idleModel.animations,
    idleGroup
  );
  const { actions: walkingActions, names: walkingNames } = useAnimations(
    processedWalkingAnimations,
    walkingGroup
  );

  const keysPressed = useRef<KeysPressed>({});
  const moveDirection = useRef(new Vector3());

  // Current logical position (ground level)
  const currentPosition = useRef(new Vector3(position[0], -1.2, position[2]));
  const currentRotation = useRef(initialRotation);
  const rotationSpeed = 3; // Tốc độ quay

  // Animation state
  const [isWalking, setIsWalking] = useState(false);

  // Animation names mapping
  const animationNames = useMemo(() => {
    console.log("Available idle animations:", idleNames);
    console.log("Available walking animations:", walkingNames);

    return {
      idle: idleNames.length > 0 ? idleNames[0] : null,
      walk: walkingNames.length > 0 ? walkingNames[0] : null,
    };
  }, [idleNames, walkingNames]);

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
    if (isWalking) {
      // Stop idle animations
      if (idleActions && animationNames.idle) {
        const idleAction = idleActions[animationNames.idle];
        if (idleAction) {
          idleAction.stop();
        }
      }

      // Play walking animations
      if (walkingActions && animationNames.walk) {
        const walkAction = walkingActions[animationNames.walk];
        if (walkAction) {
          walkAction.reset().play();
        }
      }
    } else {
      // Stop walking animations
      if (walkingActions && animationNames.walk) {
        const walkAction = walkingActions[animationNames.walk];
        if (walkAction) {
          walkAction.stop();
        }
      }

      // Play idle animations
      if (idleActions && animationNames.idle) {
        const idleAction = idleActions[animationNames.idle];
        if (idleAction) {
          idleAction.reset().play();
        }
      }
    }
  }, [isWalking, idleActions, walkingActions, animationNames]);

  // Khởi tạo idle animation khi component mount
  useEffect(() => {
    if (idleActions && animationNames.idle && !isWalking) {
      const idleAction = idleActions[animationNames.idle];
      if (idleAction) {
        idleAction.play();
      }
    }
  }, [idleActions, animationNames.idle, isWalking]);

  // Set initial rotation for group
  useEffect(() => {
    if (group.current) {
      group.current.rotation.y = initialRotation;
    }
  }, [initialRotation]);

  useFrame((state, delta) => {
    if (!group.current) return;

    const speed = 8;
    const keys = keysPressed.current;
    let isMoving = false;

    // Skip movement input if disabled (sitting mode)
    if (disabled) {
      // Still update animation state to idle when disabled
      if (isWalking !== false) {
        setIsWalking(false);
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

    // Cập nhật animation state chỉ khi cần thiết
    if (isWalking !== isMoving) {
      setIsWalking(isMoving);
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

      // Check collision and find valid position with dynamic height
      const validPosition = findNearestValidPosition(
        targetPosition,
        currentPosition.current,
        0.5 // Character radius
      );

      // Update position only if different from current
      if (!validPosition.equals(currentPosition.current)) {
        currentPosition.current.copy(validPosition);
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
      {!isWalking && (
        <group ref={idleGroup} position={[0, 0.1, 0]}>
          <primitive object={idleModel.scene} scale={scale} />
        </group>
      )}

      {/* Hiển thị walking model với Y offset riêng */}
      {isWalking && (
        <group ref={walkingGroup} position={[0, -1.2, 0]}>
          <primitive object={walkingModel.scene} scale={scale} />
        </group>
      )}
    </group>
  );
}

// Preload cả hai models
useGLTF.preload("/animation/idle.glb");
useGLTF.preload("/animation/walking.glb");
