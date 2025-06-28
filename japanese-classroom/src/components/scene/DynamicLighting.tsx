"use client";

import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { DirectionalLight, Vector3, Color } from "three";

export default function DynamicLighting() {
  const directionalLightRef = useRef<DirectionalLight>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time - chỉ sử dụng thời gian thực tế
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Calculate lighting based on simplified 3-phase system
  const calculateLightingData = (time: Date) => {
    const hours = time.getHours();
    const minutes = time.getMinutes();
    const totalMinutes = hours * 60 + minutes;

    // 3 giai đoạn ánh sáng
    if (totalMinutes >= 6 * 60 && totalMinutes < 16 * 60) {
      // 6h-16h: Ban ngày - Sáng nhất
      return {
        intensity: 1.2,
        ambientIntensity: 0.8,
        color: new Color(0xffffff), // Trắng sáng
        shadowIntensity: 1.0,
      };
    } else if (totalMinutes >= 16 * 60 && totalMinutes < 18.5 * 60) {
      // 16h-18h30: Buổi chiều - Độ sáng vừa phải, ửng hồng
      return {
        intensity: 0.8,
        ambientIntensity: 0.6,
        color: new Color(0xffb366), // Màu cam ửng hồng
        shadowIntensity: 0.7,
      };
    } else {
      // 18h30-6h: Ban đêm - Tối nhất
      return {
        intensity: 0.3,
        ambientIntensity: 0.25,
        color: new Color(0x6699ff), // Ánh sáng xanh nhạt như trăng
        shadowIntensity: 0.3,
      };
    }
  };

  // Calculate sun position for shadow direction
  const calculateSunPosition = (time: Date) => {
    const hours = time.getHours();
    const minutes = time.getMinutes();
    const totalMinutes = hours * 60 + minutes;

    // Đơn giản hóa vị trí mặt trời
    if (totalMinutes >= 6 * 60 && totalMinutes < 18.5 * 60) {
      // Ban ngày và buổi chiều: mặt trời ở phía trên
      const progress = (totalMinutes - 6 * 60) / (12.5 * 60); // 0-1 từ 6h đến 18h30
      const angle = progress * Math.PI; // 0 đến PI

      return new Vector3(
        Math.cos(angle) * 30,
        Math.sin(angle) * 20 + 10, // Luôn ở trên ground
        -10
      );
    } else {
      // Ban đêm: ánh sáng từ phía trên nhẹ (như trăng)
      return new Vector3(0, 15, 10);
    }
  };

  useFrame(() => {
    if (!directionalLightRef.current) return;

    const lightingData = calculateLightingData(currentTime);
    const sunPosition = calculateSunPosition(currentTime);

    // Update directional light
    directionalLightRef.current.position.copy(sunPosition);
    directionalLightRef.current.intensity = lightingData.intensity;
    directionalLightRef.current.color.copy(lightingData.color);

    // Make light look at center
    directionalLightRef.current.lookAt(0, 0, 0);
  });

  const lightingData = calculateLightingData(currentTime);
  const sunPosition = calculateSunPosition(currentTime);

  return (
    <>
      {/* Ambient Light - Ánh sáng môi trường */}
      <ambientLight
        intensity={lightingData.ambientIntensity}
        color={lightingData.color}
      />

      {/* Main Directional Light - Ánh sáng chính */}
      <directionalLight
        ref={directionalLightRef}
        position={sunPosition}
        intensity={lightingData.intensity}
        color={lightingData.color}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={100}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />

      {/* Soft fill light - Ánh sáng phụ */}
      <directionalLight
        position={[-sunPosition.x * 0.2, 8, -sunPosition.z * 0.2]}
        intensity={lightingData.intensity * 0.3}
        color={new Color(0xffffff)}
      />
    </>
  );
}
