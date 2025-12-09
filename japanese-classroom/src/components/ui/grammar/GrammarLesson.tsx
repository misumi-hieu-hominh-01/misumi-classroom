"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { GrammarList } from "./GrammarList";
import { GrammarDisplay } from "./GrammarDisplay";
import { useQuery } from "@tanstack/react-query";
import { contentApi, GrammarPoint } from "@/api/content-api";
import { attendanceApi } from "@/api/attendance-api";

// Helper function to fetch multiple grammar points by IDs
async function fetchGrammarPointsByIds(ids: string[]): Promise<GrammarPoint[]> {
	if (ids.length === 0) return [];

	// Fetch all items in parallel
	const promises = ids.map((id) => contentApi.getGrammarPoint(id));
	const items = await Promise.all(promises);

	// Maintain the order of IDs
	return ids
		.map((id) => items.find((item) => item._id === id))
		.filter((item): item is GrammarPoint => item !== undefined);
}

interface GrammarLessonProps {
	onProgressChange?: (progress: number) => void;
}

export function GrammarLesson({
	onProgressChange,
}: GrammarLessonProps = {}) {
	const [currentIndex, setCurrentIndex] = useState(0);
	const [completedIndices, setCompletedIndices] = useState<Set<number>>(
		new Set()
	);

	// Fetch daily state to get assigned grammar IDs
	const { data: dailyState, isLoading: isLoadingDailyState } = useQuery({
		queryKey: ["daily-state"],
		queryFn: () => attendanceApi.getStatus(),
	});

	// Fetch grammar points from assigned IDs
	const {
		data: grammarPoints,
		isLoading: isLoadingGrammar,
		error,
	} = useQuery({
		queryKey: ["grammar-lesson", dailyState?.assigned.grammarIds],
		queryFn: () => {
			if (
				!dailyState?.assigned.grammarIds ||
				dailyState.assigned.grammarIds.length === 0
			) {
				return Promise.resolve([]);
			}
			return fetchGrammarPointsByIds(dailyState.assigned.grammarIds);
		},
		enabled:
			!!dailyState &&
			!!dailyState.assigned.grammarIds &&
			dailyState.assigned.grammarIds.length > 0,
	});

	const isLoading = isLoadingDailyState || isLoadingGrammar;
	const grammarPointsList = grammarPoints || [];
	const currentGrammar = grammarPointsList[currentIndex];
	const totalGrammars = grammarPointsList.length;
	const completedCount = completedIndices.size;
	const progress =
		totalGrammars > 0 ? (completedCount / totalGrammars) * 100 : 0;

	// Mark current grammar as completed when viewing
	useEffect(() => {
		if (currentIndex >= 0 && currentIndex < totalGrammars) {
			setCompletedIndices((prev) => new Set([...prev, currentIndex]));
		}
	}, [currentIndex, totalGrammars]);

	// Notify parent of progress changes
	useEffect(() => {
		if (onProgressChange) {
			onProgressChange(progress);
		}
	}, [progress, onProgressChange]);

	function handlePrevious() {
		if (currentIndex > 0) {
			setCurrentIndex(currentIndex - 1);
		}
	}

	function handleNext() {
		if (currentIndex < totalGrammars - 1) {
			setCurrentIndex(currentIndex + 1);
		}
	}

	function handleGrammarSelect(index: number) {
		setCurrentIndex(index);
	}

	function handleStartTest() {
		// TODO: Implement test functionality
		console.log("Starting grammar test...");
	}

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-full">
				<div className="text-center">
					<div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
					<p className="text-gray-600">Loading grammar...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex items-center justify-center h-full">
				<div className="text-center text-red-500">
					<p className="text-xl mb-2">Error loading grammar</p>
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

	if (!isLoading && grammarPointsList.length === 0) {
		return (
			<div className="flex items-center justify-center h-full">
				<div className="text-center text-gray-500">
					<p className="text-xl">Chưa có ngữ pháp được giao hôm nay</p>
					<p className="text-sm mt-2">Vui lòng điểm danh để nhận bài học</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex h-full">
			{/* Left Side - Grammar List */}
			<div className="w-2/5 border-r border-gray-200 bg-gray-50 flex flex-col">
				<div className="p-4 border-b border-gray-200 space-y-2">
					<h3 className="text-base font-semibold text-gray-900">Grammar List</h3>
					{/* Progress Bar */}
					<div className="space-y-1.5">
						<div className="flex items-center justify-between text-xs">
							<span className="text-gray-600">
								Progress: {completedCount}/{totalGrammars} Grammar Points Learned
							</span>
							<span className="font-semibold text-gray-900">
								{Math.round(progress)}%
							</span>
						</div>
						<div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
							<div
								className="h-full bg-blue-500 transition-all duration-300"
								style={{ width: `${progress}%` }}
							/>
						</div>
					</div>
				</div>

				<div className="flex-1 overflow-y-auto p-3">
					<GrammarList
						grammarPoints={grammarPointsList}
						currentIndex={currentIndex}
						completedIndices={completedIndices}
						onGrammarSelect={handleGrammarSelect}
					/>
				</div>

				<div className="p-4 border-t border-gray-200 space-y-3">
					<button
						onClick={handleStartTest}
						disabled={completedCount < totalGrammars}
						className="w-full py-2 rounded-lg bg-blue-400 text-white text-sm font-semibold hover:bg-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
					>
						{completedCount < totalGrammars
							? "Complete all to unlock test"
							: "Start Test"}
					</button>
				</div>
			</div>

			{/* Right Side - Grammar Display */}
			<div className="w-3/5 flex flex-col">
				<div className="flex-1 overflow-y-auto p-6">
					{currentGrammar ? (
						<GrammarDisplay grammar={currentGrammar} />
					) : (
						<div className="flex items-center justify-center h-full text-gray-400">
							<p>Chọn một điểm ngữ pháp để xem chi tiết</p>
						</div>
					)}
				</div>

				{/* Navigation and Actions */}
				<div className="border-t border-gray-200 p-4 space-y-3">
					{/* Navigation Buttons */}
					<div className="flex items-center justify-between gap-3">
						<button
							onClick={handlePrevious}
							disabled={currentIndex === 0}
							className="px-4 py-2 rounded-lg border-2 border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
						>
							<ChevronLeft className="w-4 h-4" />
							Previous
						</button>

						<button
							onClick={handleNext}
							disabled={currentIndex === totalGrammars - 1}
							className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
						>
							Next
							<ChevronRight className="w-4 h-4" />
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

