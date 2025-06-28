"use client";

import { useRef, useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3 } from "three";

interface ThirdPersonCameraProps {
  target: Vector3;
  targetRotation: number;
  distance?: number;
  height?: number;
  smoothness?: number;
  isMoving?: boolean;
}

// Classroom boundaries (dựa trên scale 3x)
const CLASSROOM_BOUNDS = {
  minX: -34,
  maxX: 5,
  minZ: -26,
  maxZ: 1,
  minY: -3,
  maxY: 15, // Cho phép camera cao hơn
};

// Kiểm tra xem vị trí có trong classroom không
function isInsideClassroom(position: Vector3): boolean {
  return (
    position.x >= CLASSROOM_BOUNDS.minX &&
    position.x <= CLASSROOM_BOUNDS.maxX &&
    position.z >= CLASSROOM_BOUNDS.minZ &&
    position.z <= CLASSROOM_BOUNDS.maxZ &&
    position.y >= CLASSROOM_BOUNDS.minY &&
    position.y <= CLASSROOM_BOUNDS.maxY
  );
}

// Clamp position trong classroom bounds
function clampToClassroom(position: Vector3): Vector3 {
  return new Vector3(
    Math.max(
      CLASSROOM_BOUNDS.minX,
      Math.min(CLASSROOM_BOUNDS.maxX, position.x)
    ),
    Math.max(
      CLASSROOM_BOUNDS.minY,
      Math.min(CLASSROOM_BOUNDS.maxY, position.y)
    ),
    Math.max(CLASSROOM_BOUNDS.minZ, Math.min(CLASSROOM_BOUNDS.maxZ, position.z))
  );
}

// Tính toán camera position phù hợp khi bị constraints
function calculateConstrainedCameraPosition(
  target: Vector3,
  idealPosition: Vector3,
  defaultDistance: number,
  defaultHeight: number
): { position: Vector3; distance: number; height: number } {
  // Nếu ideal position trong classroom, sử dụng nó
  if (isInsideClassroom(idealPosition)) {
    return {
      position: idealPosition,
      distance: defaultDistance,
      height: defaultHeight,
    };
  }

  // Nếu không, thử clamp position
  const clampedPosition = clampToClassroom(idealPosition);

  // Kiểm tra nếu clampedPosition còn quá gần tường
  const bufferDistance = 1.5; // Khoảng cách buffer từ tường
  const adjustedPosition = new Vector3();

  // Adjust X if too close to walls
  if (clampedPosition.x <= CLASSROOM_BOUNDS.minX + bufferDistance) {
    adjustedPosition.x = CLASSROOM_BOUNDS.minX + bufferDistance;
  } else if (clampedPosition.x >= CLASSROOM_BOUNDS.maxX - bufferDistance) {
    adjustedPosition.x = CLASSROOM_BOUNDS.maxX - bufferDistance;
  } else {
    adjustedPosition.x = clampedPosition.x;
  }

  // Adjust Z if too close to walls
  if (clampedPosition.z <= CLASSROOM_BOUNDS.minZ + bufferDistance) {
    adjustedPosition.z = CLASSROOM_BOUNDS.minZ + bufferDistance;
  } else if (clampedPosition.z >= CLASSROOM_BOUNDS.maxZ - bufferDistance) {
    adjustedPosition.z = CLASSROOM_BOUNDS.maxZ - bufferDistance;
  } else {
    adjustedPosition.z = clampedPosition.z;
  }

  adjustedPosition.y = clampedPosition.y;

  // Tính toán distance và height mới dựa trên vị trí đã điều chỉnh
  const adjustedDistance = target.distanceTo(adjustedPosition);
  const deltaY = adjustedPosition.y - target.y;

  return {
    position: adjustedPosition,
    distance: Math.max(3, Math.min(adjustedDistance, defaultDistance)), // Min 3, max defaultDistance
    height: Math.max(3, deltaY), // Min height 3
  };
}

export default function ThirdPersonCamera({
  target,
  targetRotation,
  distance = 6,
  height = 6,
  smoothness = 0.1,
  isMoving = false,
}: ThirdPersonCameraProps) {
  const { camera, gl } = useThree();
  const idealOffset = useRef(new Vector3());
  const idealLookAt = useRef(new Vector3());
  const currentPosition = useRef(new Vector3());
  const currentLookAt = useRef(new Vector3());

  // Camera state
  const [cameraAngleOffset, setCameraAngleOffset] = useState(0);
  const [isUserControlling, setIsUserControlling] = useState(false);
  const [adaptiveDistance, setAdaptiveDistance] = useState(distance);
  const [adaptiveHeight, setAdaptiveHeight] = useState(height);
  const resetIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mouseState = useRef({
    isPressed: false,
    lastX: 0,
    lastY: 0,
  });

  // Mouse event handlers
  useEffect(() => {
    const canvas = gl.domElement;

    const handleMouseDown = (event: MouseEvent) => {
      if (event.button === 2) {
        // Right mouse button
        event.preventDefault();
        mouseState.current.isPressed = true;
        mouseState.current.lastX = event.clientX;
        mouseState.current.lastY = event.clientY;
        setIsUserControlling(true);
        canvas.style.cursor = "grabbing";

        // Clear any ongoing reset
        if (resetIntervalRef.current) {
          clearInterval(resetIntervalRef.current);
          resetIntervalRef.current = null;
        }
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!mouseState.current.isPressed) return;

      const deltaX = event.clientX - mouseState.current.lastX;
      const sensitivity = 0.005;

      // Kéo sang trái = xoay camera sang phải (angle tăng)
      // Kéo sang phải = xoay camera sang trái (angle giảm)
      setCameraAngleOffset((prev) => prev + deltaX * sensitivity);

      mouseState.current.lastX = event.clientX;
      mouseState.current.lastY = event.clientY;
    };

    const handleMouseUp = (event: MouseEvent) => {
      if (event.button === 2) {
        mouseState.current.isPressed = false;
        canvas.style.cursor = "default";
        setIsUserControlling(false);
      }
    };

    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault(); // Prevent right-click context menu
    };

    // Add event listeners
    canvas.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("contextmenu", handleContextMenu);

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [gl.domElement]);

  // Reset camera to behind character when moving
  useEffect(() => {
    if (isMoving && Math.abs(cameraAngleOffset) > 0.01) {
      // Clear any existing reset interval
      if (resetIntervalRef.current) {
        clearInterval(resetIntervalRef.current);
      }

      // Start smooth reset camera angle to behind character
      const resetSpeed = 0.08;

      resetIntervalRef.current = setInterval(() => {
        setCameraAngleOffset((prev) => {
          const newOffset = prev * (1 - resetSpeed);
          if (Math.abs(newOffset) < 0.01) {
            if (resetIntervalRef.current) {
              clearInterval(resetIntervalRef.current);
              resetIntervalRef.current = null;
            }
            return 0;
          }
          return newOffset;
        });
      }, 16); // ~60fps

      return () => {
        if (resetIntervalRef.current) {
          clearInterval(resetIntervalRef.current);
          resetIntervalRef.current = null;
        }
      };
    }
  }, [isMoving, cameraAngleOffset]);

  useFrame(() => {
    // Calculate final camera angle (character rotation + user offset)
    const finalCameraAngle = targetRotation + Math.PI + cameraAngleOffset;

    // Check if character is inside classroom
    const isCharacterInClassroom = isInsideClassroom(target);

    // Calculate ideal camera position (behind and above the target)
    const idealPosition = new Vector3();
    idealPosition.copy(target);
    idealPosition.x += Math.sin(finalCameraAngle) * adaptiveDistance;
    idealPosition.z += Math.cos(finalCameraAngle) * adaptiveDistance;
    idealPosition.y += adaptiveHeight;

    // Only apply classroom constraints if character is inside classroom
    if (isCharacterInClassroom) {
      // Apply classroom constraints
      const constrainedResult = calculateConstrainedCameraPosition(
        target,
        idealPosition,
        distance,
        height
      );

      // Update adaptive distance/height based on constraints
      setAdaptiveDistance(constrainedResult.distance);
      setAdaptiveHeight(constrainedResult.height);

      // Store constrained position as ideal
      idealOffset.current.copy(constrainedResult.position);
    } else {
      // Character is outside classroom - use normal camera behavior
      setAdaptiveDistance(distance);
      setAdaptiveHeight(height);

      // Use ideal position without constraints
      idealOffset.current.copy(idealPosition);
    }

    // Calculate ideal look-at position (slightly above the target)
    idealLookAt.current.copy(target);
    idealLookAt.current.y += 2;

    // Smoothly interpolate camera position
    const currentSmoothness = isUserControlling ? smoothness * 2 : smoothness;
    currentPosition.current.lerp(idealOffset.current, currentSmoothness);
    currentLookAt.current.lerp(idealLookAt.current, currentSmoothness);

    // Only apply final safety check if character is in classroom
    if (isCharacterInClassroom) {
      currentPosition.current.copy(clampToClassroom(currentPosition.current));
    }

    // Update camera
    camera.position.copy(currentPosition.current);
    camera.lookAt(currentLookAt.current);
  });

  return null;
}
