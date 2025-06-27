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

export default function ThirdPersonCamera({
  target,
  targetRotation,
  distance = 7,
  height = 6,
  smoothness = 0.1,
  isMoving = false,
}: ThirdPersonCameraProps) {
  const { camera, gl } = useThree();
  const idealOffset = useRef(new Vector3());
  const idealLookAt = useRef(new Vector3());
  const currentPosition = useRef(new Vector3());
  const currentLookAt = useRef(new Vector3());

  // Camera orbit state
  const [cameraAngleOffset, setCameraAngleOffset] = useState(0);
  const [isUserControlling, setIsUserControlling] = useState(false);
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

    // Calculate ideal camera position (behind and above the target)
    idealOffset.current.copy(target);
    idealOffset.current.x += Math.sin(finalCameraAngle) * distance;
    idealOffset.current.z += Math.cos(finalCameraAngle) * distance;
    idealOffset.current.y += height;

    // Calculate ideal look-at position (slightly above the target)
    idealLookAt.current.copy(target);
    idealLookAt.current.y += 2;

    // Smoothly interpolate camera position
    const currentSmoothness = isUserControlling ? smoothness * 2 : smoothness;
    currentPosition.current.lerp(idealOffset.current, currentSmoothness);
    currentLookAt.current.lerp(idealLookAt.current, currentSmoothness);

    // Update camera
    camera.position.copy(currentPosition.current);
    camera.lookAt(currentLookAt.current);
  });

  return null;
}
