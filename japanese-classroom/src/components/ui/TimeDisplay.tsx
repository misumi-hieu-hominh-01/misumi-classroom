"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, Clock } from "lucide-react";

export default function TimeDisplay() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isVisible, setIsVisible] = useState(true);

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
    <div className="relative z-[60]">
      {/* Time Display */}
      <div
        className={`bg-black/80 text-white rounded-lg p-3 shadow-lg transition-all duration-300 overflow-hidden ${
          isVisible
            ? "opacity-100 translate-x-0 translate-y-0 scale-100 w-auto min-w-[200px]"
            : "opacity-0 -translate-x-0 -translate-y-0 scale-0 w-0 min-w-0 h-0"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="text-center flex-1">
            <div className="text-lg font-mono">{formatTime(currentTime)}</div>
            <div className="text-xs mt-1">{getTimeOfDay(currentTime)}</div>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 rounded hover:bg-white/20 transition-colors flex-shrink-0 relative z-[70] cursor-pointer"
            aria-label="Ẩn đồng hồ"
            type="button"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Toggle Button (when hidden) - Positioned at top-left corner */}
      <button
        onClick={() => setIsVisible(true)}
        className={`bg-black/80 text-white rounded-lg shadow-lg hover:bg-black/90 transition-all duration-300 flex items-center justify-center absolute top-0 left-0 z-[60] cursor-pointer ${
          isVisible
            ? "opacity-0 scale-0 pointer-events-none w-0 h-0 p-0"
            : "opacity-100 scale-100 pointer-events-auto w-10 h-10 p-2"
        }`}
        aria-label="Hiện đồng hồ"
        type="button"
      >
        <Clock className="w-5 h-5" />
      </button>
    </div>
  );
}
