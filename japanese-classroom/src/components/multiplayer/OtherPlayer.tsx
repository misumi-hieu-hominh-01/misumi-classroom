"use client";

import { useRef, useEffect, useMemo, useState, memo } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations, Text } from "@react-three/drei";
import { Group, Vector3, AnimationClip } from "three";
import * as THREE from "three";
import { PlayerData } from "@/types/multiplayer";
import { calculateHeight } from "../scene/CollisionSystem";

interface OtherPlayerProps {
  player: PlayerData;
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

// Component không memo để tránh re-render không cần thiết
function OtherPlayerComponent({ player }: OtherPlayerProps) {
  const groupRef = useRef<Group>(null);
  const idleGroup = useRef<Group>(null);
  const walkingGroup = useRef<Group>(null);
  const runningGroup = useRef<Group>(null);

  // Load animation models (preloaded for performance)
  const idleModelSource = useGLTF("/animation/idle.glb");
  const walkingModelSource = useGLTF("/animation/walking.glb");
  const runningModelSource = useGLTF("/animation/running.glb");

  // Clone scenes để mỗi player có instance riêng - CRITICAL for multiple players
  const clonedScenes = useMemo(() => {
    return {
      idle: idleModelSource.scene.clone(true),
      walking: walkingModelSource.scene.clone(true),
      running: runningModelSource.scene.clone(true),
    };
  }, [
    idleModelSource.scene,
    walkingModelSource.scene,
    runningModelSource.scene,
  ]);

  // Clone và process animations để mỗi player có animations riêng
  const processedWalkingAnimations = useMemo(() => {
    if (!walkingModelSource.animations.length) return [];

    return walkingModelSource.animations.map((clip) => {
      const clonedClip = clip.clone();
      removeRootMotion(clonedClip, "mixamorigHips");
      return clonedClip;
    });
  }, [walkingModelSource.animations]);

  const processedRunningAnimations = useMemo(() => {
    if (!runningModelSource.animations.length) return [];

    return runningModelSource.animations.map((clip) => {
      const clonedClip = clip.clone();
      removeRootMotion(clonedClip, "mixamorigHips");
      return clonedClip;
    });
  }, [runningModelSource.animations]);

  // Clone idle animations
  const clonedIdleAnimations = useMemo(() => {
    if (!idleModelSource.animations.length) return [];
    return idleModelSource.animations.map((clip) => clip.clone());
  }, [idleModelSource.animations]);

  // Use animations for each model with cloned animations
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

  // Position interpolation
  const targetPosition = useRef(
    new Vector3(player.position.x, player.position.y, player.position.z)
  );
  const currentPosition = useRef(
    new Vector3(player.position.x, player.position.y, player.position.z)
  );
  const currentRotation = useRef(player.rotation.y);

  // Update target position when player data changes
  useEffect(() => {
    targetPosition.current.set(
      player.position.x,
      player.position.y,
      player.position.z
    );
    currentRotation.current = player.rotation.y;
  }, [player.position, player.rotation]);

  // Update animation state based on isMoving
  useEffect(() => {
    // Determine animation based on isMoving
    // We'll use walking for normal movement, running for fast movement
    // For now, we'll use walking when moving
    if (player.isMoving) {
      setIsWalking(true);
      setIsRunning(false);
    } else {
      setIsWalking(false);
      setIsRunning(false);
    }
  }, [player.isMoving]);

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
      if (runningActions && animationNames.run) {
        const runAction = runningActions[animationNames.run];
        if (runAction) {
          runAction.reset().play();
        }
      }
    } else if (isWalking) {
      if (walkingActions && animationNames.walk) {
        const walkAction = walkingActions[animationNames.walk];
        if (walkAction) {
          walkAction.reset().play();
        }
      }
    } else {
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

  // Cleanup cloned scenes on unmount để tránh memory leak
  useEffect(() => {
    return () => {
      // Dispose cloned scenes để free memory
      clonedScenes.idle.traverse((child) => {
        if ("geometry" in child && child.geometry)
          (child.geometry as THREE.BufferGeometry).dispose();
        if ("material" in child && child.material) {
          const material = child.material as THREE.Material | THREE.Material[];
          if (Array.isArray(material)) {
            material.forEach((mat) => mat.dispose());
          } else {
            material.dispose();
          }
        }
      });
      clonedScenes.walking.traverse((child) => {
        if ("geometry" in child && child.geometry)
          (child.geometry as THREE.BufferGeometry).dispose();
        if ("material" in child && child.material) {
          const material = child.material as THREE.Material | THREE.Material[];
          if (Array.isArray(material)) {
            material.forEach((mat) => mat.dispose());
          } else {
            material.dispose();
          }
        }
      });
      clonedScenes.running.traverse((child) => {
        if ("geometry" in child && child.geometry)
          (child.geometry as THREE.BufferGeometry).dispose();
        if ("material" in child && child.material) {
          const material = child.material as THREE.Material | THREE.Material[];
          if (Array.isArray(material)) {
            material.forEach((mat) => mat.dispose());
          } else {
            material.dispose();
          }
        }
      });
    };
  }, [clonedScenes]);

  // Smooth interpolation to target position
  useFrame(() => {
    if (!groupRef.current) return;

    // Lerp to target position for smooth movement
    const lerpFactor = player.isMoving ? 0.15 : 0.08;
    currentPosition.current.lerp(targetPosition.current, lerpFactor);

    // Lerp rotation
    currentRotation.current +=
      (player.rotation.y - currentRotation.current) * lerpFactor * 2;

    // Calculate height based on position
    const height = calculateHeight(currentPosition.current);
    const displayPosition = new Vector3(
      currentPosition.current.x,
      height + 1.2, // Same offset as StickMan
      currentPosition.current.z
    );

    groupRef.current.position.copy(displayPosition);
    groupRef.current.rotation.y = currentRotation.current;
  });

  const scale = 0.9; // Same scale as StickMan in ClassroomScene

  return (
    <group ref={groupRef}>
      {/* Idle model - using cloned scene */}
      {!isWalking && !isRunning && (
        <group ref={idleGroup} position={[0, 0.1, 0]}>
          <primitive object={clonedScenes.idle} scale={scale} />
        </group>
      )}

      {/* Walking model - using cloned scene */}
      {isWalking && !isRunning && (
        <group ref={walkingGroup} position={[0, -1.2, 0]}>
          <primitive object={clonedScenes.walking} scale={scale} />
        </group>
      )}

      {/* Running model - using cloned scene */}
      {isRunning && (
        <group ref={runningGroup} position={[0, -1.2, 0]}>
          <primitive object={clonedScenes.running} scale={scale} />
        </group>
      )}

      {/* Username label using drei Text */}
      <Text
        position={[0, 2.5, 0]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="black"
      >
        {player.username}
      </Text>
    </group>
  );
}

// Export memoized component để tối ưu performance khi có nhiều players
export const OtherPlayer = memo(
  OtherPlayerComponent,
  (prevProps, nextProps) => {
    // Custom comparison để chỉ re-render khi dữ liệu thực sự thay đổi
    return (
      prevProps.player.id === nextProps.player.id &&
      prevProps.player.position.x === nextProps.player.position.x &&
      prevProps.player.position.y === nextProps.player.position.y &&
      prevProps.player.position.z === nextProps.player.position.z &&
      prevProps.player.rotation.y === nextProps.player.rotation.y &&
      prevProps.player.isMoving === nextProps.player.isMoving &&
      prevProps.player.username === nextProps.player.username
    );
  }
);

OtherPlayer.displayName = "OtherPlayer";

// Preload models để cải thiện performance khi có nhiều players
useGLTF.preload("/animation/idle.glb");
useGLTF.preload("/animation/walking.glb");
useGLTF.preload("/animation/running.glb");
