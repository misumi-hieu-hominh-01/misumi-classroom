"use client";

import { useRef, useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3 } from "three";

interface FirstPersonCameraProps {
  target: Vector3;
  targetRotation: number;
  eyeHeight?: number;
  sensitivity?: number;
  isMoving?: boolean;
  defaultPitch?: number; // Góc nhìn xuống mặc định
}

export default function FirstPersonCamera({
  target,
  targetRotation,
  eyeHeight = 4, // Chiều cao mắt từ vị trí nhân vật
  sensitivity = 0.002,
  isMoving = false,
  defaultPitch = -0.1, // Nhìn xuống một chút mặc định (radians)
}: FirstPersonCameraProps) {
  const { camera, gl } = useThree();
  const [mouseAngleX, setMouseAngleX] = useState(defaultPitch); // Pitch (nhìn lên/xuống) - bắt đầu với default
  const [mouseAngleY, setMouseAngleY] = useState(0); // Yaw (quay trái/phải)
  const resetIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const mouseState = useRef({
    isPressed: false,
    lastX: 0,
    lastY: 0,
  });

  // Mouse controls
  useEffect(() => {
    const canvas = gl.domElement;

    const handleMouseDown = (event: MouseEvent) => {
      if (event.button === 0) {
        // Left mouse button
        event.preventDefault();
        mouseState.current.isPressed = true;
        mouseState.current.lastX = event.clientX;
        mouseState.current.lastY = event.clientY;
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
      const deltaY = event.clientY - mouseState.current.lastY;

      // Update mouse angles
      setMouseAngleY((prev) => prev + deltaX * sensitivity);
      setMouseAngleX((prev) => {
        const newAngle = prev - deltaY * sensitivity;
        // Limit pitch to prevent over-rotation
        return Math.max(-Math.PI / 2, Math.min(Math.PI / 2, newAngle));
      });

      mouseState.current.lastX = event.clientX;
      mouseState.current.lastY = event.clientY;
    };

    const handleMouseUp = (event: MouseEvent) => {
      if (event.button === 0) {
        mouseState.current.isPressed = false;
        canvas.style.cursor = "default";
      }
    };

    // Add event listeners
    canvas.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [gl.domElement, sensitivity]);

  // Reset camera angles to default when moving
  useEffect(() => {
    if (
      isMoving &&
      (Math.abs(mouseAngleY) > 0.01 ||
        Math.abs(mouseAngleX - defaultPitch) > 0.01)
    ) {
      // Clear any existing reset interval
      if (resetIntervalRef.current) {
        clearInterval(resetIntervalRef.current);
      }

      // Start smooth reset both yaw and pitch to default
      const resetSpeed = 0.08;

      resetIntervalRef.current = setInterval(() => {
        let yawReset = false;
        let pitchReset = false;

        setMouseAngleY((prev) => {
          const newAngle = prev * (1 - resetSpeed);
          if (Math.abs(newAngle) < 0.01) {
            yawReset = true;
            return 0;
          }
          return newAngle;
        });

        setMouseAngleX((prev) => {
          const targetAngle = defaultPitch;
          const diff = targetAngle - prev;
          const newAngle = prev + diff * resetSpeed;
          if (Math.abs(newAngle - targetAngle) < 0.01) {
            pitchReset = true;
            return targetAngle;
          }
          return newAngle;
        });

        // Stop interval if both angles are reset
        if (yawReset && pitchReset) {
          if (resetIntervalRef.current) {
            clearInterval(resetIntervalRef.current);
            resetIntervalRef.current = null;
          }
        }
      }, 16); // ~60fps

      return () => {
        if (resetIntervalRef.current) {
          clearInterval(resetIntervalRef.current);
          resetIntervalRef.current = null;
        }
      };
    }
  }, [isMoving, mouseAngleY, mouseAngleX, defaultPitch]);

  useFrame(() => {
    // Position camera slightly in front of character's head to avoid clipping
    const eyePosition = new Vector3();
    eyePosition.copy(target);

    // Dịch camera ra phía trước theo hướng nhân vật đang quay
    const forwardOffset = 0.3; // Khoảng cách ra phía trước
    eyePosition.x += Math.sin(targetRotation) * forwardOffset;
    eyePosition.z += Math.cos(targetRotation) * forwardOffset;
    eyePosition.y += eyeHeight;

    // Calculate final rotation (character rotation + mouse input)
    const finalYaw = targetRotation + mouseAngleY;
    const finalPitch = mouseAngleX;

    // Calculate look direction
    const lookDirection = new Vector3();
    lookDirection.x = Math.sin(finalYaw) * Math.cos(finalPitch);
    lookDirection.y = Math.sin(finalPitch);
    lookDirection.z = Math.cos(finalYaw) * Math.cos(finalPitch);

    // Calculate look-at point
    const lookAt = new Vector3();
    lookAt.copy(eyePosition);
    lookAt.add(lookDirection);

    // Update camera
    camera.position.copy(eyePosition);
    camera.lookAt(lookAt);
  });

  return null;
}
