"use client";

import { useState, useEffect } from "react";

export default function TimeDisplay() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getTimeOfDay = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const totalMinutes = hours * 60 + minutes;

    // Sử dụng cùng logic với DynamicLighting để đồng bộ
    if (totalMinutes >= 6 * 60 && totalMinutes < 16 * 60) {
      return "☀️ Ban ngày";
    } else if (totalMinutes >= 16 * 60 && totalMinutes < 18.5 * 60) {
      return "🌇 Buổi chiều";
    } else {
      return "🌙 Ban đêm";
    }
  };

  return (
    <div className="absolute top-4 right-4 z-10 bg-black/80 text-white rounded-lg p-3 shadow-lg min-w-[200px]">
      <div className="text-center">
        <div className="text-lg font-mono">{formatTime(currentTime)}</div>
        <div className="text-xs mt-1">{getTimeOfDay(currentTime)}</div>
      </div>
    </div>
  );
}
