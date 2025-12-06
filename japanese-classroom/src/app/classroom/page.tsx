"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { AudioController, Header } from "../../components/ui";

// Dynamic import để tránh SSR issues với Three.js
const ClassroomScene = dynamic(() => import("../../components/scene"), {
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

export default function ClassroomPage() {
	const router = useRouter();

	const handleExitClassroom = useCallback(() => {
		router.push("/");
	}, [router]);

	return (
		<main className="w-full h-screen overflow-hidden">
			{/* Header */}
			<Header />

			<ClassroomScene onExitClassroom={handleExitClassroom} />

			{/* Audio Controller */}
			<AudioController />
		</main>
	);
}

