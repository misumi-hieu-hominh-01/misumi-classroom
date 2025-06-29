"use client";

import { useState, useEffect } from "react";

interface InteractionButtonProps {
  visible: boolean;
  checkpointType: "seat" | "desk" | "board" | "door" | "custom";
  checkpointName: string;
  onInteract: () => void;
  disabled?: boolean;
}

export default function InteractionButton({
  visible,
  checkpointType,
  checkpointName,
  onInteract,
  disabled = false,
}: InteractionButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Hiển thị tooltip sau 1 giây
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => setShowTooltip(true), 1000);
      return () => clearTimeout(timer);
    } else {
      setShowTooltip(false);
    }
  }, [visible]);

  const getIcon = () => {
    switch (checkpointType) {
      case "seat":
        return (
          <svg
            className="w-8 h-8 text-blue-600"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M7 11h2v2H7zm0 4h10v-2H7v2zm0-8h2V5H7v2zm4 0h2V5h-2v2zm4 0h2V5h-2v2zM7 15h10v6H7v-6z" />
            <path d="M3 3v16h18V3H3zm16 14H5V5h14v12z" />
          </svg>
        );
      case "desk":
        return (
          <svg
            className="w-8 h-8 text-amber-600"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M20 6H4c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zM4 16V8h16v8H4z" />
          </svg>
        );
      case "board":
        return (
          <svg
            className="w-8 h-8 text-green-600"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM5 19V5h14v14H5z" />
            <path d="M9 7h6v2H9zm0 4h6v2H9z" />
          </svg>
        );
      case "door":
        return (
          <svg
            className="w-8 h-8 text-red-600"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM5 19V5h14v14H5z" />
            <circle cx="16" cy="12" r="1" />
          </svg>
        );
      default:
        return (
          <svg
            className="w-8 h-8 text-purple-600"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        );
    }
  };

  const getActionText = () => {
    switch (checkpointType) {
      case "seat":
        return "Ngồi xuống";
      case "desk":
        return "Sử dụng";
      case "board":
        return "Xem gần";
      case "door":
        return "Mở cửa";
      default:
        return "Tương tác";
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50">
      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-sm py-2 px-4 rounded-lg whitespace-nowrap animate-fade-in">
          <div className="text-center">
            <div className="font-medium">{checkpointName}</div>
            <div className="text-xs text-gray-300 mt-1">
              Click để {getActionText().toLowerCase()}
            </div>
          </div>
          {/* Arrow pointer */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/80"></div>
        </div>
      )}

      {/* Main Button */}
      <button
        onClick={() => {
          if (!disabled) {
            setIsPressed(true);
            onInteract();
            setTimeout(() => setIsPressed(false), 200);
          }
        }}
        disabled={disabled}
        className={`
          relative w-20 h-20 rounded-full
          bg-white/95 backdrop-blur-sm
          shadow-2xl hover:shadow-3xl
          border-4 border-gray-200 hover:border-blue-300
          transform transition-all duration-300 ease-out
          hover:scale-110 active:scale-95
          disabled:opacity-50 disabled:cursor-not-allowed
          ${isPressed ? "scale-95" : ""}
          group overflow-hidden
        `}
      >
        {/* Hiệu ứng ánh sáng khi hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Hiệu ứng pulse animation */}
        <div className="absolute inset-0 rounded-full border-2 border-blue-400/30 animate-ping" />
        <div className="absolute inset-0 rounded-full border-2 border-blue-300/20 animate-ping animation-delay-300" />

        {/* Icon */}
        <div className="relative z-10 flex items-center justify-center h-full">
          {getIcon()}
        </div>

        {/* Action indicator */}
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {getActionText()}
        </div>
      </button>

      {/* Keyboard hint */}
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-center">
        <div className="bg-black/70 text-white text-xs px-2 py-1 rounded">
          Hoặc nhấn <kbd className="bg-gray-600 px-1 rounded">F</kbd>
        </div>
      </div>
    </div>
  );
}
