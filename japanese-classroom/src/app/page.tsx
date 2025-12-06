"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { AudioController, Header } from "../components/ui";

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

export default function Home() {
  const router = useRouter();

  const handleEnterClassroom = useCallback(() => {
    router.push("/classroom");
  }, [router]);

  return (
    <main className="w-full h-screen overflow-hidden">
      {/* Header */}
      <Header />

      <CityScene onEnterClassroom={handleEnterClassroom} />

      {/* Audio Controller */}
      <AudioController />
    </main>
  );
}
