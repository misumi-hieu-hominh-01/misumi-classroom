"use client";

import { useState, useEffect } from "react";
import { X, Volume2, VolumeX } from "lucide-react";

interface ChatDialogProps {
  visible: boolean;
  speakerName: string;
  messages: string[];
  onClose: () => void;
  position?: {
    x: number;
    y: number;
  };
}

export default function ChatDialog({
  visible,
  speakerName,
  messages,
  onClose,
  position = { x: 50, y: 20 }, // Default center-top position
}: ChatDialogProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Speech synthesis functions
  const speakMessage = (text: string) => {
    // Stop any current speech
    window.speechSynthesis.cancel();

    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = "ja-JP"; // Japanese language
    msg.rate = 0.8; // Slightly slower for better understanding
    msg.pitch = 1.1; // Slightly higher pitch for teacher voice

    msg.onstart = () => setIsSpeaking(true);
    msg.onend = () => setIsSpeaking(false);
    msg.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(msg);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const toggleSpeech = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      const currentMessage = messages[currentMessageIndex];
      if (currentMessage) {
        speakMessage(currentMessage);
      }
    }
  };

  // Reset when dialog becomes visible
  useEffect(() => {
    if (visible) {
      setCurrentMessageIndex(0);
      setDisplayedText("");
      setIsTyping(true);
      stopSpeaking(); // Stop any ongoing speech
    } else {
      stopSpeaking(); // Stop speech when dialog closes
    }
  }, [visible]);

  // Typing effect for current message
  useEffect(() => {
    if (!visible || !isTyping || currentMessageIndex >= messages.length) return;

    const currentMessage = messages[currentMessageIndex];
    let charIndex = 0;
    setDisplayedText("");

    const typingInterval = setInterval(() => {
      if (charIndex < currentMessage.length) {
        setDisplayedText(currentMessage.slice(0, charIndex + 1));
        charIndex++;
      } else {
        clearInterval(typingInterval);
        setIsTyping(false);
      }
    }, 50); // Typing speed

    return () => clearInterval(typingInterval);
  }, [visible, isTyping, currentMessageIndex, messages]);

  const handleNextMessage = () => {
    stopSpeaking(); // Stop current speech when moving to next message
    if (currentMessageIndex < messages.length - 1) {
      setCurrentMessageIndex(currentMessageIndex + 1);
      setIsTyping(true);
    } else {
      onClose();
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!visible) return;

    if (event.code === "Space" || event.code === "Enter") {
      event.preventDefault();
      if (isTyping) {
        // Skip typing animation
        setDisplayedText(messages[currentMessageIndex]);
        setIsTyping(false);
      } else {
        handleNextMessage();
      }
    } else if (event.code === "Escape") {
      onClose();
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [visible, isTyping, currentMessageIndex, messages]);

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
      {/* Speech Bubble */}
      <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border-4 border-gray-200 max-w-md pointer-events-auto animate-fade-in">
        {/* Speaker Name */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              🎓 {speakerName}
            </h3>
            <button
              onClick={toggleSpeech}
              className={`p-2 rounded-full transition-colors ${
                isSpeaking
                  ? "bg-blue-100 text-blue-600 hover:bg-blue-200"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              title={isSpeaking ? "Dừng phát âm" : "Phát âm tin nhắn"}
            >
              {isSpeaking ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Message Content */}
        <div className="text-gray-700 text-base leading-relaxed mb-4 min-h-[60px]">
          {displayedText}
          {isTyping && (
            <span className="inline-block w-2 h-5 bg-gray-400 ml-1 animate-pulse" />
          )}
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {currentMessageIndex + 1} / {messages.length}
          </div>

          <div className="text-xs text-gray-500">
            {isTyping ? (
              <span>
                Nhấn <kbd className="px-1 bg-gray-200 rounded">Space</kbd> để bỏ
                qua
              </span>
            ) : currentMessageIndex < messages.length - 1 ? (
              <span>
                Nhấn <kbd className="px-1 bg-gray-200 rounded">Space</kbd> để
                tiếp tục
              </span>
            ) : (
              <span>
                Nhấn <kbd className="px-1 bg-gray-200 rounded">Space</kbd> để
                kết thúc
              </span>
            )}
          </div>
        </div>

        {/* Speech Bubble Tail */}
        <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
          <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[12px] border-transparent border-t-white"></div>
          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[14px] border-r-[14px] border-t-[14px] border-transparent border-t-gray-200"></div>
        </div>
      </div>

      {/* Background overlay to close dialog */}
      <div className="fixed inset-0 bg-black/10 -z-10" onClick={onClose} />
    </div>
  );
}
