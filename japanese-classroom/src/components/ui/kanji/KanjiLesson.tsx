"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { KanjiList } from "./KanjiList";
import { KanjiDisplay } from "./KanjiDisplay";
import { KanjiTest } from "./KanjiTest";
import { useQuery } from "@tanstack/react-query";
import { contentApi, KanjiItem } from "@/api/content-api";
import { attendanceApi } from "@/api/attendance-api";
import {
  loadProgress,
  saveProgress,
  clearProgress,
} from "@/utils/lesson-progress";

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

interface KanjiLessonProps {
  onProgressChange?: (progress: number) => void;
  onTestComplete?: (score: number, total: number) => void;
  unlockNext?: () => void;
  nextLessonName?: string;
}

export function KanjiLesson({
  onProgressChange,
  onTestComplete,
  unlockNext,
  nextLessonName,
}: KanjiLessonProps = {}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedIndices, setCompletedIndices] = useState<Set<number>>(
    new Set()
  );
  const [showTest, setShowTest] = useState(false);
  const [storedDateKey, setStoredDateKey] = useState<string | null>(null);
  const [testPassed, setTestPassed] = useState(false);

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

  // Load progress from localStorage when dailyState is available
  useEffect(() => {
    if (!dailyState?.checkedInAt) return;

    const checkedInDate = new Date(dailyState.checkedInAt);
    const dateKey = checkedInDate.toISOString().split("T")[0];

    // If dateKey changed, reset and load new progress
    if (storedDateKey !== dateKey) {
      // Clear old progress if exists
      if (storedDateKey) {
        clearProgress("kanji", storedDateKey);
      }

      // Load progress for new date
      const savedProgress = loadProgress("kanji", dateKey);
      if (savedProgress) {
        setCompletedIndices(new Set(savedProgress.completedIndices));
        setTestPassed(savedProgress.testPassed || false);
      } else {
        setCompletedIndices(new Set());
        setTestPassed(false);
      }
      setStoredDateKey(dateKey);
    }
  }, [dailyState?.checkedInAt, storedDateKey]);

  // Save progress to localStorage when completedIndices changes
  useEffect(() => {
    if (!dailyState?.checkedInAt || !storedDateKey) return;

    const checkedInDate = new Date(dailyState.checkedInAt);
    const dateKey = checkedInDate.toISOString().split("T")[0];

    if (storedDateKey === dateKey && completedIndices.size > 0) {
      saveProgress("kanji", dateKey, {
        completedIndices: Array.from(completedIndices),
      });
    }
  }, [completedIndices, dailyState?.checkedInAt, storedDateKey]);

  // Mark current kanji as completed when viewing
  useEffect(() => {
    if (currentIndex >= 0 && currentIndex < totalKanjis) {
      setCompletedIndices((prev) => new Set([...prev, currentIndex]));
    }
  }, [currentIndex, totalKanjis]);

  // Notify parent of progress changes (only after progress is loaded)
  useEffect(() => {
    if (onProgressChange && storedDateKey && !isLoading) {
      onProgressChange(progress);
    }
  }, [progress, onProgressChange, storedDateKey, isLoading]);

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
    setShowTest(true);
  }

  function handleCloseTest() {
    setShowTest(false);
  }

  function handleTestComplete(score: number, total: number) {
    const isPerfect = score === total;
    setTestPassed(isPerfect);

    if (onTestComplete) {
      onTestComplete(score, total);
    }

    // Save test result to localStorage
    if (dailyState?.checkedInAt && storedDateKey) {
      const checkedInDate = new Date(dailyState.checkedInAt);
      const dateKey = checkedInDate.toISOString().split("T")[0];
      saveProgress("kanji", dateKey, {
        testPassed: isPerfect,
        testScore: score,
        testTotal: total,
      });
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải kanji...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-red-500">
          <p className="text-xl mb-2">Lỗi khi tải kanji</p>
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
    <>
      {/* Test Modal */}
      {showTest && (
        <KanjiTest
          kanjis={kanjiItemsList}
          onClose={handleCloseTest}
          onTestComplete={handleTestComplete}
          unlockNext={unlockNext}
          nextLessonName={nextLessonName}
        />
      )}

      <div className="flex h-full">
        {/* Left Side - Kanji List */}
        <div className="w-2/5 border-r border-gray-200 bg-gray-50 flex flex-col">
          <div className="p-4 border-b border-gray-200 space-y-2">
            <h3 className="text-base font-semibold text-gray-900">
              Danh sách kanji
            </h3>
            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">
                  Tiến độ: {completedCount}/{totalKanjis} kanji đã học
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
            <KanjiList
              kanjis={kanjiItemsList}
              currentIndex={currentIndex}
              completedIndices={completedIndices}
              onKanjiSelect={handleKanjiSelect}
            />
          </div>

          <div className="p-4 border-t border-gray-200 space-y-3">
            <button
              onClick={handleStartTest}
              disabled={completedCount < totalKanjis || testPassed}
              className="w-full py-2 rounded-lg bg-blue-400 text-white text-sm font-semibold hover:bg-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {testPassed
                ? "Đã hoàn thành 100%"
                : completedCount < totalKanjis
                ? "Hoàn thành tất cả để mở khóa bài kiểm tra"
                : "Bắt đầu kiểm tra"}
            </button>
          </div>
        </div>

        {/* Right Side - Kanji Display */}
        <div className="w-3/5 flex flex-col">
          <div className="flex-1 overflow-y-auto p-6">
            {currentKanji ? (
              <KanjiDisplay kanji={currentKanji} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <p>Chọn một kanji để xem chi tiết</p>
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
                Trước
              </button>

              <button
                onClick={handleNext}
                disabled={currentIndex === totalKanjis - 1}
                className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                Tiếp theo
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
