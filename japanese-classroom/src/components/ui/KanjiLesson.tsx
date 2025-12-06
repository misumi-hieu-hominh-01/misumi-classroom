"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { KanjiList } from "./KanjiList";
import { KanjiDisplay } from "./KanjiDisplay";
import { useQuery } from "@tanstack/react-query";
import { contentApi, KanjiItem } from "@/api/content-api";
import { attendanceApi } from "@/api/attendance-api";

// Helper function to fetch multiple kanji items by IDs
async function fetchKanjiItemsByIds(ids: string[]): Promise<KanjiItem[]> {
	if (ids.length === 0) return [];

	// Fetch all items in parallel
	const promises = ids.map((id) => contentApi.getKanjiItem(id));
	const items = await Promise.all(promises);

	// Maintain the order of IDs
	return ids
		.map((id) => items.find((item) => item._id === id))
		.filter((item): item is KanjiItem => item !== undefined);
}

export function KanjiLesson() {
	const [currentIndex, setCurrentIndex] = useState(0);
	const [completedIndices, setCompletedIndices] = useState<Set<number>>(
		new Set()
	);

	// Fetch daily state to get assigned kanji IDs
	const { data: dailyState, isLoading: isLoadingDailyState } = useQuery({
		queryKey: ["daily-state"],
		queryFn: () => attendanceApi.getStatus(),
	});

	// Fetch kanji items from assigned IDs
	const {
		data: kanjiItems,
		isLoading: isLoadingKanji,
		error,
	} = useQuery({
		queryKey: ["kanji-lesson", dailyState?.assigned.kanjiIds],
		queryFn: () => {
			if (
				!dailyState?.assigned.kanjiIds ||
				dailyState.assigned.kanjiIds.length === 0
			) {
				return Promise.resolve([]);
			}
			return fetchKanjiItemsByIds(dailyState.assigned.kanjiIds);
		},
		enabled:
			!!dailyState &&
			!!dailyState.assigned.kanjiIds &&
			dailyState.assigned.kanjiIds.length > 0,
	});

	const isLoading = isLoadingDailyState || isLoadingKanji;
	const kanjiItemsList = kanjiItems || [];
	const currentKanji = kanjiItemsList[currentIndex];
	const totalKanjis = kanjiItemsList.length;
	const completedCount = completedIndices.size;
	const progress = totalKanjis > 0 ? (completedCount / totalKanjis) * 100 : 0;

	// Mark current kanji as completed when viewing
	useEffect(() => {
		if (currentIndex >= 0 && currentIndex < totalKanjis) {
			setCompletedIndices((prev) => new Set([...prev, currentIndex]));
		}
	}, [currentIndex, totalKanjis]);

	function handlePrevious() {
		if (currentIndex > 0) {
			setCurrentIndex(currentIndex - 1);
		}
	}

	function handleNext() {
		if (currentIndex < totalKanjis - 1) {
			setCurrentIndex(currentIndex + 1);
		}
	}

	function handleKanjiSelect(index: number) {
		setCurrentIndex(index);
	}

	function handleStartTest() {
		// TODO: Implement test functionality
		console.log("Starting kanji test...");
	}

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-full">
				<div className="text-center">
					<div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
					<p className="text-gray-600">Loading kanji...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex items-center justify-center h-full">
				<div className="text-center text-red-500">
					<p className="text-xl mb-2">Error loading kanji</p>
					<p className="text-sm">{error.message}</p>
				</div>
			</div>
		);
	}

	if (!isLoading && (!dailyState || !dailyState.checkedInAt)) {
		return (
			<div className="flex items-center justify-center h-full">
				<div className="text-center text-gray-500">
					<p className="text-xl">Chưa điểm danh hôm nay</p>
					<p className="text-sm mt-2">Vui lòng điểm danh để bắt đầu bài học</p>
				</div>
			</div>
		);
	}

	if (!isLoading && kanjiItemsList.length === 0) {
		return (
			<div className="flex items-center justify-center h-full">
				<div className="text-center text-gray-500">
					<p className="text-xl">Chưa có kanji được giao hôm nay</p>
					<p className="text-sm mt-2">Vui lòng điểm danh để nhận bài học</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex h-full">
			{/* Left Side - Kanji List */}
			<div className="w-2/5 border-r border-gray-200 bg-gray-50 flex flex-col">
				<div className="p-6 border-b border-gray-200">
					<h3 className="text-lg font-semibold text-gray-900">
						Kanji List ({completedCount}/{totalKanjis})
					</h3>
				</div>

				<div className="flex-1 overflow-y-auto p-4">
					<KanjiList
						kanjis={kanjiItemsList}
						currentIndex={currentIndex}
						completedIndices={completedIndices}
						onKanjiSelect={handleKanjiSelect}
					/>
				</div>

				<div className="p-6 border-t border-gray-200">
					<div className="mb-4">
						<div className="text-sm text-gray-600 mb-2">
							Continue from where you left off
						</div>
					</div>
				</div>
			</div>

			{/* Right Side - Kanji Display */}
			<div className="w-3/5 flex flex-col">
				<div className="flex-1 overflow-y-auto p-8">
					{currentKanji ? (
						<KanjiDisplay kanji={currentKanji} />
					) : (
						<div className="flex items-center justify-center h-full text-gray-400">
							<p>Chọn một kanji để xem chi tiết</p>
						</div>
					)}
				</div>

				{/* Navigation and Actions */}
				<div className="border-t border-gray-200 p-6 space-y-4">
					{/* Navigation Buttons */}
					<div className="flex items-center justify-between gap-4">
						<button
							onClick={handlePrevious}
							disabled={currentIndex === 0}
							className="px-6 py-3 rounded-lg border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
						>
							<ChevronLeft className="w-5 h-5" />
							Previous
						</button>

						<button
							onClick={handleNext}
							disabled={currentIndex === totalKanjis - 1}
							className="px-6 py-3 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
						>
							Next
							<ChevronRight className="w-5 h-5" />
						</button>
					</div>

					{/* Progress Bar */}
					<div className="space-y-2">
						<div className="flex items-center justify-between text-sm">
							<span className="text-gray-600">
								Progress: {completedCount}/{totalKanjis} Kanjis Learned
							</span>
							<span className="font-semibold text-gray-900">
								{Math.round(progress)}%
							</span>
						</div>
						<div className="h-2 bg-gray-200 rounded-full overflow-hidden">
							<div
								className="h-full bg-blue-500 transition-all duration-300"
								style={{ width: `${progress}%` }}
							/>
						</div>
					</div>

					{/* Start Test Button */}
					<button
						onClick={handleStartTest}
						disabled={completedCount < totalKanjis}
						className="w-full py-3 rounded-lg bg-blue-400 text-white font-semibold hover:bg-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
					>
						{completedCount < totalKanjis
							? "Complete all kanji to unlock"
							: "Start Test"}
					</button>
				</div>
			</div>
		</div>
	);
}

