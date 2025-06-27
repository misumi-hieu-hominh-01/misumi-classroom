"use client";

import { useState, useEffect } from "react";

interface TimeDisplayProps {
  useFakeTime: boolean;
  timeSpeed: number;
  onToggleFakeTime: () => void;
  onTimeSpeedChange: (speed: number) => void;
}

export default function TimeDisplay({
  useFakeTime,
  timeSpeed,
  onToggleFakeTime,
  onTimeSpeedChange,
}: TimeDisplayProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      if (useFakeTime) {
        setCurrentTime((prev) => new Date(prev.getTime() + 60000 * timeSpeed));
      } else {
        setCurrentTime(new Date());
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [useFakeTime, timeSpeed]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getTimeOfDay = (date: Date) => {
    const hours = date.getHours();
    if (hours >= 6 && hours < 8) return "🌅 Bình minh";
    if (hours >= 8 && hours < 17) return "☀️ Ban ngày";
    if (hours >= 17 && hours < 19) return "🌇 Hoàng hôn";
    return "🌙 Ban đêm";
  };

  return (
    <div className="absolute top-4 right-4 z-10 bg-black/80 text-white rounded-lg p-3 shadow-lg min-w-[200px]">
      <div className="text-center mb-2">
        <div className="text-lg font-mono">{formatTime(currentTime)}</div>
        <div className="text-xs">{getTimeOfDay(currentTime)}</div>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span>Demo Mode:</span>
          <button
            onClick={onToggleFakeTime}
            className={`px-2 py-1 rounded text-xs font-semibold ${
              useFakeTime
                ? "bg-orange-500 text-white"
                : "bg-gray-600 text-gray-300"
            }`}
          >
            {useFakeTime ? "ON" : "OFF"}
          </button>
        </div>

        {useFakeTime && (
          <div className="space-y-1">
            <div className="text-center">Tốc độ: {timeSpeed}x</div>
            <div className="flex gap-1">
              {[1, 12, 24, 60].map((speed) => (
                <button
                  key={speed}
                  onClick={() => onTimeSpeedChange(speed)}
                  className={`flex-1 px-1 py-1 rounded text-xs ${
                    timeSpeed === speed
                      ? "bg-blue-500 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
