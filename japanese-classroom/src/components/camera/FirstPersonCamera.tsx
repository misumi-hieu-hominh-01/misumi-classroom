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
  initialYaw?: number; // Góc hướng nhìn ban đầu (yaw)
  isSitting?: boolean; // Có đang ngồi không (bỏ qua targetRotation)
}

export default function FirstPersonCamera({
  target,
  targetRotation,
  eyeHeight = 4, // Chiều cao mắt từ vị trí nhân vật
  sensitivity = 0.002,
  isMoving = false,
  defaultPitch = -0.1, // Nhìn xuống một chút mặc định (radians)
  initialYaw = 0, // Góc hướng nhìn ban đầu
  isSitting = false, // Có đang ngồi không
}: FirstPersonCameraProps) {
  const { camera, gl } = useThree();
  const [mouseAngleX, setMouseAngleX] = useState(defaultPitch); // Pitch (nhìn lên/xuống) - bắt đầu với default
  const [mouseAngleY, setMouseAngleY] = useState(initialYaw); // Yaw (quay trái/phải) - bắt đầu với initialYaw
  const resetIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Reset camera angles when initialYaw changes
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log(
        `FirstPersonCamera: Setting initialYaw to ${(
          (initialYaw * 180) /
          Math.PI
        ).toFixed(1)}° (Sitting: ${isSitting})`
      );
    }
    setMouseAngleY(initialYaw);
  }, [initialYaw, isSitting]);

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
      (Math.abs(mouseAngleY - initialYaw) > 0.01 ||
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
          const targetAngle = initialYaw;
          const diff = targetAngle - prev;
          const newAngle = prev + diff * resetSpeed;
          if (Math.abs(newAngle - targetAngle) < 0.01) {
            yawReset = true;
            return targetAngle;
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
  }, [isMoving, mouseAngleY, mouseAngleX, defaultPitch, initialYaw]);

  useFrame(() => {
    // Position camera slightly in front of character's head to avoid clipping
    const eyePosition = new Vector3();
    eyePosition.copy(target);

    // Dịch camera ra phía trước theo hướng nhân vật đang quay
    const forwardOffset = 0.3; // Khoảng cách ra phía trước
    eyePosition.x += Math.sin(targetRotation) * forwardOffset;
    eyePosition.z += Math.cos(targetRotation) * forwardOffset;
    eyePosition.y += eyeHeight;

    // Calculate final rotation
    // When sitting, ignore character rotation and use only camera angle
    const finalYaw = isSitting ? mouseAngleY : targetRotation + mouseAngleY;
    const finalPitch = mouseAngleX;

    // Debug log for sitting mode (only log occasionally to avoid spam)
    if (
      isSitting &&
      Math.random() < 0.01 &&
      process.env.NODE_ENV === "development"
    ) {
      console.log(
        `Camera angles - Target: ${((targetRotation * 180) / Math.PI).toFixed(
          1
        )}°, Mouse: ${((mouseAngleY * 180) / Math.PI).toFixed(1)}°, Final: ${(
          (finalYaw * 180) /
          Math.PI
        ).toFixed(1)}°`
      );
    }

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
