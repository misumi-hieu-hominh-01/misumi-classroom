"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { WordList } from "./WordList";
import { WordDisplay } from "./WordDisplay";
import { VocabMatchingTest } from "./VocabMatchingTest";
import { useQuery } from "@tanstack/react-query";
import { contentApi, VocabItem } from "@/api/content-api";
import { attendanceApi } from "@/api/attendance-api";
import {
  loadProgress,
  saveProgress,
  clearProgress,
} from "@/utils/lesson-progress";

// Helper function to fetch multiple vocab items by IDs
async function fetchVocabItemsByIds(ids: string[]): Promise<VocabItem[]> {
  if (ids.length === 0) return [];

  // Fetch all items in parallel
  const promises = ids.map((id) => contentApi.getVocabItem(id));
  const items = await Promise.all(promises);

  // Maintain the order of IDs
  return ids
    .map((id) => items.find((item) => item._id === id))
    .filter((item): item is VocabItem => item !== undefined);
}

interface VocabularyLessonProps {
  onProgressChange?: (progress: number) => void;
  onTestComplete?: (score: number, total: number) => void;
  unlockNext?: () => void;
  nextLessonName?: string;
}

export function VocabularyLesson({
  onProgressChange,
  onTestComplete,
  unlockNext,
  nextLessonName,
}: VocabularyLessonProps = {}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedIndices, setCompletedIndices] = useState<Set<number>>(
    new Set()
  );
  const [showTest, setShowTest] = useState(false);
  const [storedDateKey, setStoredDateKey] = useState<string | null>(null);
  const [testPassed, setTestPassed] = useState(false);

  // Fetch daily state to get assigned vocab IDs
  const { data: dailyState, isLoading: isLoadingDailyState } = useQuery({
    queryKey: ["daily-state"],
    queryFn: () => attendanceApi.getStatus(),
  });

  // Fetch vocabulary items from assigned IDs
  const {
    data: vocabItems,
    isLoading: isLoadingVocab,
    error,
  } = useQuery({
    queryKey: ["vocabulary-lesson", dailyState?.assigned.vocabIds],
    queryFn: () => {
      if (
        !dailyState?.assigned.vocabIds ||
        dailyState.assigned.vocabIds.length === 0
      ) {
        return Promise.resolve([]);
      }
      return fetchVocabItemsByIds(dailyState.assigned.vocabIds);
    },
    enabled:
      !!dailyState &&
      !!dailyState.assigned.vocabIds &&
      dailyState.assigned.vocabIds.length > 0,
  });

  const isLoading = isLoadingDailyState || isLoadingVocab;
  const vocabItemsList = vocabItems || [];
  const currentWord = vocabItemsList[currentIndex];
  const totalWords = vocabItemsList.length;
  const completedCount = completedIndices.size;
  const progress = totalWords > 0 ? (completedCount / totalWords) * 100 : 0;

  // Load progress from localStorage when dailyState is available
  useEffect(() => {
    if (!dailyState?.checkedInAt) return;

    const checkedInDate = new Date(dailyState.checkedInAt);
    const dateKey = checkedInDate.toISOString().split("T")[0];

    // If dateKey changed, reset and load new progress
    if (storedDateKey !== dateKey) {
      // Clear old progress if exists
      if (storedDateKey) {
        clearProgress("vocab", storedDateKey);
      }

      // Load progress for new date
      const savedProgress = loadProgress("vocab", dateKey);
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
      saveProgress("vocab", dateKey, {
        completedIndices: Array.from(completedIndices),
      });
    }
  }, [completedIndices, dailyState?.checkedInAt, storedDateKey]);

  // Mark current word as completed when viewing
  useEffect(() => {
    if (currentIndex >= 0 && currentIndex < totalWords) {
      setCompletedIndices((prev) => new Set([...prev, currentIndex]));
    }
  }, [currentIndex, totalWords]);

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
    if (currentIndex < totalWords - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }

  function handleWordSelect(index: number) {
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
      saveProgress("vocab", dateKey, {
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
          <p className="text-gray-600">Đang tải từ vựng...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-red-500">
          <p className="text-xl mb-2">Lỗi khi tải từ vựng</p>
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

  if (!isLoading && vocabItemsList.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500">
          <p className="text-xl">Chưa có từ vựng được giao hôm nay</p>
          <p className="text-sm mt-2">Vui lòng điểm danh để nhận bài học</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Test Modal */}
      {showTest && (
        <VocabMatchingTest
          words={vocabItemsList}
          onClose={handleCloseTest}
          onTestComplete={handleTestComplete}
          unlockNext={unlockNext}
          nextLessonName={nextLessonName}
        />
      )}

      <div className="flex h-full">
        {/* Left Side - Word List */}
        <div className="w-2/5 border-r border-gray-200 bg-gray-50 flex flex-col">
          <div className="p-4 border-b border-gray-200 space-y-2">
            <h3 className="text-base font-semibold text-gray-900">
              Danh sách từ
            </h3>
            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">
                  Tiến độ: {completedCount}/{totalWords} từ đã học
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
            <WordList
              words={vocabItemsList}
              currentIndex={currentIndex}
              completedIndices={completedIndices}
              onWordSelect={handleWordSelect}
            />
          </div>

          <div className="p-4 border-t border-gray-200 space-y-3">
            <button
              onClick={handleStartTest}
              disabled={completedCount < totalWords || testPassed}
              className="w-full py-2 rounded-lg bg-blue-400 text-white text-sm font-semibold hover:bg-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {testPassed
                ? "Đã hoàn thành 100%"
                : completedCount < totalWords
                ? "Hoàn thành tất cả để mở khóa bài kiểm tra"
                : "Bắt đầu kiểm tra"}
            </button>
          </div>
        </div>

        {/* Right Side - Word Display */}
        <div className="w-3/5 flex flex-col">
          <div className="flex-1 overflow-y-auto p-6">
            {currentWord ? (
              <WordDisplay word={currentWord} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <p>Chọn một từ để xem chi tiết</p>
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
                disabled={currentIndex === totalWords - 1}
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
