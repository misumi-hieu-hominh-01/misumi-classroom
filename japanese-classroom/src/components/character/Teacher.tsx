import { useRef, useEffect, useState } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Group, Vector3 } from "three";

interface TeacherProps {
  position?: [number, number, number];
  scale?: number;
  rotation?: [number, number, number];
  playerPosition?: Vector3; // Position of player to look at
}

export default function Teacher({
  position = [0, -1.2, -22],
  scale = 0.9,
  rotation = [0, 0, 0],
  playerPosition,
}: TeacherProps) {
  const group = useRef<Group>(null);
  const delayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isReturningToDefault, setIsReturningToDefault] = useState(false);
  const [shouldReturnToDefault, setShouldReturnToDefault] = useState(false);

  // Load teacher model and animations
  const idleGltf = useGLTF("/3d_source/teacher_idle.glb");
  const standingGltf = useGLTF("/animation/standing.glb");

  const { actions: idleActions, names: idleNames } = useAnimations(
    idleGltf.animations,
    group
  );
  const { actions: standingActions, names: standingNames } = useAnimations(
    standingGltf.animations,
    group
  );

  // Ensure model visibility
  useEffect(() => {
    // Force all children visible for both models
    idleGltf.scene.traverse((child) => {
      child.visible = true;
    });
    standingGltf.scene.traverse((child) => {
      child.visible = true;
    });
  }, [idleGltf, standingGltf]);

  // Auto-play idle animation when component mounts (only once)
  useEffect(() => {
    if (idleNames.length > 0) {
      const idleAction = idleActions[idleNames[0]];
      if (idleAction) {
        idleAction.reset().play();
        // Loop the animation
        idleAction.setLoop(2201, Infinity); // LoopRepeat = 2201
      }
    }
  }, [idleActions, idleNames]);

  // Handle animation switching based on player presence (with delay)
  useEffect(() => {
    if (playerPosition) {
      // Player nearby - play standing animation immediately
      // Stop idle animation
      if (idleNames.length > 0) {
        const idleAction = idleActions[idleNames[0]];
        if (idleAction && idleAction.isRunning()) {
          idleAction.fadeOut(0.5);
        }
      }

      // Start standing animation
      if (standingNames.length > 0) {
        const standingAction = standingActions[standingNames[0]];
        if (standingAction && !standingAction.isRunning()) {
          standingAction.reset().fadeIn(0.5).play();
          standingAction.setLoop(2201, Infinity); // LoopRepeat
        }
      }
    } else if (shouldReturnToDefault && isReturningToDefault) {
      // Player left and 2 second delay has passed - switch to idle animation
      // Stop standing animation
      if (standingNames.length > 0) {
        const standingAction = standingActions[standingNames[0]];
        if (standingAction && standingAction.isRunning()) {
          standingAction.fadeOut(0.5);
        }
      }

      // Start idle animation
      if (idleNames.length > 0) {
        const idleAction = idleActions[idleNames[0]];
        if (idleAction && !idleAction.isRunning()) {
          idleAction.reset().fadeIn(0.5).play();
          idleAction.setLoop(2201, Infinity); // LoopRepeat
        }
      }
    }
    // If player left but still in 2-second delay period, maintain standing animation
  }, [
    playerPosition,
    shouldReturnToDefault,
    isReturningToDefault,
    idleActions,
    idleNames,
    standingActions,
    standingNames,
  ]);

  // Handle player presence changes
  useEffect(() => {
    if (playerPosition) {
      // Player is nearby - cancel any existing timeout and stop return animation
      if (delayTimeoutRef.current) {
        clearTimeout(delayTimeoutRef.current);
        delayTimeoutRef.current = null;
      }
      setIsReturningToDefault(false);
      setShouldReturnToDefault(false);
    } else {
      // Player left - start 2 second delay before returning to default
      if (!shouldReturnToDefault && !isReturningToDefault) {
        delayTimeoutRef.current = setTimeout(() => {
          setShouldReturnToDefault(true);
          setIsReturningToDefault(true);
        }, 2000); // 2 second delay
      }
    }

    // Cleanup timeout on unmount
    return () => {
      if (delayTimeoutRef.current) {
        clearTimeout(delayTimeoutRef.current);
        delayTimeoutRef.current = null;
      }
    };
  }, [playerPosition, shouldReturnToDefault, isReturningToDefault]);

  // Smooth rotation towards player when nearby
  useFrame(() => {
    if (!group.current) return;

    if (playerPosition) {
      // Calculate direction to player
      const teacherPos = new Vector3(...position);
      const direction = playerPosition.clone().sub(teacherPos);
      direction.y = 0; // Only horizontal rotation
      direction.normalize();

      // Calculate target Y rotation
      const targetY = Math.atan2(direction.x, direction.z);

      // Smoothly interpolate to target rotation
      const currentRotation = group.current.rotation.y;
      const rotationDiff = targetY - currentRotation;

      // Handle angle wrapping
      let adjustedDiff = rotationDiff;
      if (adjustedDiff > Math.PI) adjustedDiff -= 2 * Math.PI;
      if (adjustedDiff < -Math.PI) adjustedDiff += 2 * Math.PI;

      // Smooth interpolation
      const smoothingFactor = 0.05;
      group.current.rotation.y += adjustedDiff * smoothingFactor;

      // Debug log
      if (process.env.NODE_ENV === "development") {
        console.log(`Teacher rotating towards player:
          Teacher pos: (${teacherPos.x.toFixed(1)}, ${teacherPos.z.toFixed(1)})
          Player pos: (${playerPosition.x.toFixed(
            1
          )}, ${playerPosition.z.toFixed(1)})
          Target Y: ${((targetY * 180) / Math.PI).toFixed(1)}°
          Current Y: ${((currentRotation * 180) / Math.PI).toFixed(1)}°`);
      }
    } else if (isReturningToDefault && shouldReturnToDefault) {
      // Return to default rotation after delay
      const defaultY = rotation[1];
      const currentY = group.current.rotation.y;
      const diff = defaultY - currentY;

      // Handle angle wrapping
      let adjustedDiff = diff;
      if (adjustedDiff > Math.PI) adjustedDiff -= 2 * Math.PI;
      if (adjustedDiff < -Math.PI) adjustedDiff += 2 * Math.PI;

      const smoothingFactor = 0.02;
      group.current.rotation.y += adjustedDiff * smoothingFactor;

      // Check if we're close enough to default rotation to stop
      if (Math.abs(adjustedDiff) < 0.05) {
        setIsReturningToDefault(false);
        setShouldReturnToDefault(false);
        group.current.rotation.y = defaultY; // Snap to exact position
      }
    }
    // If player left but we're still in delay period, maintain current rotation
  });

  return (
    <group ref={group} position={position} scale={scale} rotation={rotation}>
      {/* Teacher model - lớn hơn học sinh và đúng height */}
      <group position={[0, 1.3, 0]}>
        <primitive object={idleGltf.scene} scale={1.2} />
      </group>
    </group>
  );
}

// Preload teacher models and animations
useGLTF.preload("/3d_source/teacher_idle.glb");
useGLTF.preload("/animation/standing.glb");
