"use client";

import { useState, useEffect, useRef } from "react";

export default function AudioController() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [wasPlayingBeforeBlur, setWasPlayingBeforeBlur] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Khởi tạo audio
    const audio = new Audio("/music/background.mp3");
    audio.loop = true;
    audio.volume = 0.3; // Âm lượng vừa phải
    audioRef.current = audio;

    // Xử lý khi audio load xong
    const handleCanPlayThrough = () => {
      setIsLoading(false);
    };

    audio.addEventListener("canplaythrough", handleCanPlayThrough);

    return () => {
      audio.removeEventListener("canplaythrough", handleCanPlayThrough);
      audio.pause();
      audio.src = "";
    };
  }, []);

  // Xử lý pause/resume khi focus/blur hoặc tab ẩn/hiện
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!audioRef.current) return;

      if (document.hidden) {
        // Tab bị ẩn - pause nhạc nếu đang phát
        if (isPlaying) {
          setWasPlayingBeforeBlur(true);
          audioRef.current.pause();
          setIsPlaying(false);
        }
      } else {
        // Tab được hiện lại - resume nhạc nếu trước đó đang phát
        if (wasPlayingBeforeBlur) {
          setWasPlayingBeforeBlur(false);
          audioRef.current
            .play()
            .then(() => {
              setIsPlaying(true);
            })
            .catch((error) => {
              console.error("Không thể tiếp tục phát nhạc:", error);
            });
        }
      }
    };

    const handleWindowBlur = () => {
      if (!audioRef.current) return;

      // Window mất focus - pause nhạc nếu đang phát
      if (isPlaying) {
        setWasPlayingBeforeBlur(true);
        audioRef.current.pause();
        setIsPlaying(false);
      }
    };

    const handleWindowFocus = () => {
      if (!audioRef.current) return;

      // Window có focus lại - resume nhạc nếu trước đó đang phát
      if (wasPlayingBeforeBlur) {
        setWasPlayingBeforeBlur(false);
        audioRef.current
          .play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch((error) => {
            console.error("Không thể tiếp tục phát nhạc:", error);
          });
      }
    };

    // Thêm event listeners
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      // Cleanup event listeners
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [isPlaying, wasPlayingBeforeBlur]);

  const toggleAudio = async () => {
    if (!audioRef.current || isLoading) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Không thể phát nhạc:", error);
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={toggleAudio}
        disabled={isLoading}
        className={`
          relative w-15 h-15 rounded-full
          bg-transparent from-orange-400 via-yellow-400 to-amber-300
          shadow-lg hover:shadow-xl
          transform hover:scale-110 active:scale-95
          transition-all duration-300 ease-out
          border-4 border-white
          hover:border-yellow-200 cursor-pointer
          disabled:opacity-50 disabled:cursor-not-allowed
          group overflow-hidden
        `}
      >
        {/* Hiệu ứng ánh sáng khi hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Hiệu ứng sóng âm thanh khi đang phát */}
        {isPlaying && (
          <>
            <div className="absolute inset-0 rounded-full border-2 border-orange-300 animate-ping" />
            <div className="absolute inset-0 rounded-full border-2 border-yellow-300 animate-ping animation-delay-150" />
            <div className="absolute inset-0 rounded-full border-2 border-amber-300 animate-ping animation-delay-300" />
          </>
        )}

        {/* Icon âm thanh */}
        <div className="relative z-10 flex items-center justify-center h-full">
          {isLoading ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : isPlaying ? (
            <svg
              className="w-7 h-7 text-white drop-shadow-sm"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
            </svg>
          ) : (
            <svg
              className="w-7 h-7 text-white drop-shadow-sm"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
            </svg>
          )}
        </div>

        {/* Tooltip */}
        <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
          {isLoading ? "Đang tải..." : isPlaying ? "Tắt nhạc" : "Bật nhạc"}
        </div>
      </button>
    </div>
  );
}
