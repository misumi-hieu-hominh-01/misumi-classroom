"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import { Group, Vector3, AnimationClip } from "three";

interface StickManProps {
  position?: [number, number, number];
  scale?: number;
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
  onPositionChange,
}: StickManProps) {
  const group = useRef<Group>(null);
  const { scene, animations } = useGLTF("/animation/walking.glb");

  // Process animations to remove root motion
  const processedAnimations = useMemo(() => {
    if (!animations.length) return animations;

    console.log("Processing animations to remove root motion...");
    animations.forEach((clip) => {
      removeRootMotion(clip, "mixamorigHips");
    });

    return animations;
  }, [animations]);

  const { actions, names } = useAnimations(processedAnimations, group);

  const keysPressed = useRef<KeysPressed>({});
  const velocity = useRef(new Vector3());
  const moveDirection = useRef(new Vector3());
  const currentPosition = useRef(
    new Vector3(position[0], position[1] - 1.2, position[2])
  );
  const currentRotation = useRef(0);
  const rotationSpeed = 3; // Tốc độ quay

  // Animation state - sử dụng useState thay vì useRef
  const [isWalking, setIsWalking] = useState(false);

  // Animation names mapping
  const animationNames = useMemo(() => {
    console.log("Available animations:", names);
    return {
      idle:
        names.find(
          (name) =>
            name.toLowerCase().includes("idle") ||
            name.toLowerCase().includes("default") ||
            name.toLowerCase().includes("rest")
        ) || names[0], // Fallback to first animation
      walk:
        names.find(
          (name) =>
            name.toLowerCase().includes("walk") ||
            name.toLowerCase().includes("walking")
        ) || names[1], // Fallback to second animation
    };
  }, [names]);

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

  // Animation switching với logic đơn giản theo code mẫu
  useEffect(() => {
    if (!actions) return;

    const idleAction = actions[animationNames.idle];
    const walkAction = actions[animationNames.walk];

    if (!idleAction || !walkAction) {
      console.warn("Required animations not found:", {
        idle: animationNames.idle,
        walk: animationNames.walk,
        available: names,
      });
      return;
    }

    if (isWalking) {
      // Start walking animation
      walkAction.reset().fadeIn(0.5).play();
      idleAction.fadeOut(0.5);
    } else {
      // Start idle animation
      walkAction.fadeOut(0.5);
      idleAction.reset().fadeIn(0.5).play();
    }
  }, [isWalking, actions, animationNames, names]);

  // Khởi tạo idle animation khi component mount
  useEffect(() => {
    if (actions && animationNames.idle) {
      const idleAction = actions[animationNames.idle];
      if (idleAction) {
        idleAction.play();
      }
    }
  }, [actions, animationNames.idle]);

  useFrame((state, delta) => {
    if (!group.current) return;

    const speed = 8;
    const keys = keysPressed.current;
    let isMoving = false;

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

    // Apply movement relative to character rotation
    if (isMoving) {
      // Convert local movement direction to world space
      const worldDirection = new Vector3();
      worldDirection.copy(moveDirection.current);
      worldDirection.applyAxisAngle(
        new Vector3(0, 1, 0),
        currentRotation.current
      );

      // Apply movement - chỉ cập nhật X và Z, giữ Y cố định
      velocity.current.copy(worldDirection).multiplyScalar(speed * delta);
      currentPosition.current.x += velocity.current.x;
      currentPosition.current.z += velocity.current.z;
      // Y position luôn giữ cố định để tránh floating
      currentPosition.current.y = position[1] - 1.2;

      // Update group position
      group.current.position.copy(currentPosition.current);
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
    <group ref={group} position={[position[0], position[1] - 1.2, position[2]]}>
      <primitive object={scene} scale={scale} />
    </group>
  );
}

// Preload the model
useGLTF.preload("/animation/walking.glb");
