"use client";

import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { DirectionalLight, Vector3, Color } from "three";

interface DynamicLightingProps {
  timeSpeed?: number; // Multiplier for time speed (1 = real time, 24 = 1 hour = 1 minute)
  useFakeTime?: boolean; // Use fake time for demo
}

export default function DynamicLighting({
  timeSpeed = 1,
  useFakeTime = false,
}: DynamicLightingProps) {
  const directionalLightRef = useRef<DirectionalLight>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time
  useEffect(() => {
    const interval = setInterval(() => {
      if (useFakeTime) {
        // Speed up time for demo
        setCurrentTime((prev) => new Date(prev.getTime() + 60000 * timeSpeed));
      } else {
        setCurrentTime(new Date());
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timeSpeed, useFakeTime]);

  // Calculate sun position and lighting based on time
  const calculateSunData = (time: Date) => {
    const hours = time.getHours();
    const minutes = time.getMinutes();
    const totalMinutes = hours * 60 + minutes;

    // Map time to sun angle (0-24 hours -> 0-360 degrees)
    // 6 AM = East (90°), 12 PM = South (180°), 6 PM = West (270°), 12 AM = North (0°)
    const sunAngle = (totalMinutes / (24 * 60)) * 360; // 0-360 degrees

    // Calculate sun position
    const radius = 50;
    const sunHeight = Math.sin(((sunAngle - 90) * Math.PI) / 180) * 30; // Height varies with time
    const sunX = Math.cos(((sunAngle - 90) * Math.PI) / 180) * radius;
    const sunZ = Math.sin(((sunAngle - 90) * Math.PI) / 180) * radius;

    const sunPosition = new Vector3(sunX, Math.max(sunHeight, -10), sunZ);

    // Calculate lighting intensity based on sun height
    let intensity: number;
    let ambientIntensity: number;
    let sunColor: Color;

    if (hours >= 6 && hours < 8) {
      // Sunrise (6-8 AM)
      const progress = (totalMinutes - 6 * 60) / (2 * 60); // 0-1
      intensity = 0.3 + progress * 0.7; // 0.3 -> 1.0
      ambientIntensity = 0.2 + progress * 0.4; // 0.2 -> 0.6
      sunColor = new Color().setHSL(0.1, 0.8, 0.6 + progress * 0.4); // Orange to yellow
    } else if (hours >= 8 && hours < 17) {
      // Daytime (8 AM - 5 PM)
      intensity = 1.0;
      ambientIntensity = 0.6;
      sunColor = new Color().setHSL(0.15, 0.3, 0.95); // Bright white-yellow
    } else if (hours >= 17 && hours < 19) {
      // Sunset (5-7 PM)
      const progress = (totalMinutes - 17 * 60) / (2 * 60); // 0-1
      intensity = 1.0 - progress * 0.7; // 1.0 -> 0.3
      ambientIntensity = 0.6 - progress * 0.4; // 0.6 -> 0.2
      sunColor = new Color().setHSL(
        0.05 + progress * 0.05,
        0.8,
        0.8 - progress * 0.2
      ); // Yellow to orange
    } else {
      // Night (7 PM - 6 AM)
      intensity = 0.1;
      ambientIntensity = 0.15;
      sunColor = new Color().setHSL(0.6, 0.3, 0.3); // Moonlight blue
    }

    return {
      position: sunPosition,
      intensity,
      ambientIntensity,
      color: sunColor,
    };
  };

  useFrame(() => {
    if (!directionalLightRef.current) return;

    const sunData = calculateSunData(currentTime);

    // Update directional light
    directionalLightRef.current.position.copy(sunData.position);
    directionalLightRef.current.intensity = sunData.intensity;
    directionalLightRef.current.color.copy(sunData.color);

    // Make light look at center
    directionalLightRef.current.lookAt(0, 0, 0);
  });

  const sunData = calculateSunData(currentTime);

  return (
    <>
      {/* Dynamic Ambient Light */}
      <ambientLight
        intensity={sunData.ambientIntensity}
        color={sunData.color}
      />

      {/* Dynamic Directional Light (Sun) */}
      <directionalLight
        ref={directionalLightRef}
        position={sunData.position}
        intensity={sunData.intensity}
        color={sunData.color}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={100}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />

      {/* Soft fill light from opposite direction */}
      <directionalLight
        position={[-sunData.position.x * 0.3, 5, -sunData.position.z * 0.3]}
        intensity={sunData.intensity * 0.2}
        color={new Color().setHSL(0.6, 0.2, 0.8)}
      />
    </>
  );
}
