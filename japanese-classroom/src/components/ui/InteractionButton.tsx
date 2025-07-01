"use client";

import { useState, useEffect } from "react";
import {
  BookOpenText,
  Table,
  Presentation,
  DoorOpen,
  MessageCircleMore,
  CheckCircle,
  University,
} from "lucide-react";

interface InteractionButtonProps {
  visible: boolean;
  checkpointType:
    | "seat"
    | "desk"
    | "board"
    | "door"
    | "teacher"
    | "university"
    | "custom";
  checkpointName: string;
  onInteract: () => void;
  disabled?: boolean;
  keyboardKey?: string;
}

export default function InteractionButton({
  visible,
  checkpointType,
  checkpointName,
  onInteract,
  disabled = false,
  keyboardKey = "F",
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
    const iconSize = 32; // w-8 h-8 = 32px

    switch (checkpointType) {
      case "seat":
        return <BookOpenText size={iconSize} className="text-blue-600" />;
      case "desk":
        return <Table size={iconSize} className="text-amber-600" />;
      case "board":
        return <Presentation size={iconSize} className="text-green-600" />;
      case "door":
        return <DoorOpen size={iconSize} className="text-red-600" />;
      case "teacher":
        return (
          <MessageCircleMore size={iconSize} className="text-orange-600" />
        );
      case "university":
        return <University size={iconSize} className="text-blue-600" />;
      default:
        return <CheckCircle size={iconSize} className="text-purple-600" />;
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
      case "teacher":
        return "Nói chuyện";
      case "university":
        return "Vào trường đại học";
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
          cursor-pointer
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
          <kbd className=" px-1 rounded">{keyboardKey}</kbd>
        </div>
      </button>
    </div>
  );
}
