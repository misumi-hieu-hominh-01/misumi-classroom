"use client";

import dynamic from "next/dynamic";
import { useState, useCallback } from "react";
import { AudioController } from "../components/ui";

// Dynamic import để tránh SSR issues với Three.js
const ClassroomScene = dynamic(() => import("../components/scene"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center bg-gradient-to-b from-sky-200 to-blue-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-lg text-gray-700">Đang tải phòng học...</p>
      </div>
    </div>
  ),
});

const CityScene = dynamic(
  () =>
    import("../components/scene").then((mod) => ({ default: mod.CityScene })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-b from-sky-200 to-green-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-lg text-gray-700">Đang tải thành phố...</p>
        </div>
      </div>
    ),
  }
);

type Scene = "city" | "classroom";

export default function Home() {
  const [currentScene, setCurrentScene] = useState<Scene>("city");

  const handleEnterClassroom = useCallback(() => {
    setCurrentScene("classroom");
  }, []);

  const handleExitClassroom = useCallback(() => {
    setCurrentScene("city");
  }, []);

  return (
    <main className="w-full h-screen overflow-hidden">
      {currentScene === "city" ? (
        <CityScene onEnterClassroom={handleEnterClassroom} />
      ) : (
        <ClassroomScene onExitClassroom={handleExitClassroom} />
      )}

      {/* Audio Controller */}
      <AudioController />

      {/* Scene indicator */}
      <div className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
        <h1 className="text-lg font-bold text-gray-800">
          {currentScene === "city"
            ? "🏙️ Thành phố thu nhỏ"
            : "🏫 Phòng học tiếng Nhật 3D"}
        </h1>
        <p className="text-xs text-gray-600 mt-1">
          {currentScene === "city"
            ? "WASD: Di chuyển | C: Đổi camera"
            : "WASD: Di chuyển | C: Đổi camera | F: Tương tác"}
        </p>
      </div>
    </main>
  );
}
