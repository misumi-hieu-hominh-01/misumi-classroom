"use client";

import { useState, useEffect } from "react";
import { X, Lock, Check } from "lucide-react";
import { VocabularyLesson } from "./vocab";
import { KanjiLesson } from "./kanji";
import { GrammarLesson } from "./grammar";
import { useQuery } from "@tanstack/react-query";
import { attendanceApi } from "@/api/attendance-api";
import { loadProgress, saveProgress } from "@/utils/lesson-progress";
import { toast } from "sonner";

interface LessonModalProps {
  visible: boolean;
  onClose: () => void;
}

type LessonTab = "vocabulary" | "kanji" | "grammar";

export function LessonModal({ visible, onClose }: LessonModalProps) {
  const [activeTab, setActiveTab] = useState<LessonTab>("vocabulary");
  const [vocabProgress, setVocabProgress] = useState(0);
  const [kanjiProgress, setKanjiProgress] = useState(0);
  const [grammarProgress, setGrammarProgress] = useState(0);
  const [vocabTestPassed, setVocabTestPassed] = useState(false);
  const [kanjiTestPassed, setKanjiTestPassed] = useState(false);
  const [grammarTestPassed, setGrammarTestPassed] = useState(false);
  const [storedDateKey, setStoredDateKey] = useState<string | null>(null);

  // Fetch daily state to get checkedInAt date
  const { data: dailyState } = useQuery({
    queryKey: ["daily-state"],
    queryFn: () => attendanceApi.getStatus(),
  });

  // Load test results and progress from localStorage when dailyState is available
  useEffect(() => {
    if (!dailyState?.checkedInAt) return;

    const checkedInDate = new Date(dailyState.checkedInAt);
    const dateKey = checkedInDate.toISOString().split("T")[0];

    // If dateKey changed, reset and load new progress
    if (storedDateKey !== dateKey) {
      setStoredDateKey(dateKey);
    }

    // Load vocab progress and test status
    const vocabProgressData = loadProgress("vocab", dateKey);
    if (vocabProgressData) {
      setVocabTestPassed(vocabProgressData.testPassed || false);
      // Calculate progress from completedIndices
      const vocabCount = dailyState.assigned.vocabIds?.length || 0;
      if (vocabProgressData.completedIndices && vocabCount > 0) {
        const vocabProgressPercent =
          (vocabProgressData.completedIndices.length / vocabCount) * 100;
        setVocabProgress(vocabProgressPercent);
      } else {
        setVocabProgress(0);
      }
    } else {
      setVocabTestPassed(false);
      setVocabProgress(0);
    }

    // Load kanji progress and test status
    const kanjiProgressData = loadProgress("kanji", dateKey);
    if (kanjiProgressData) {
      setKanjiTestPassed(kanjiProgressData.testPassed || false);
      // Calculate progress from completedIndices
      const kanjiCount = dailyState.assigned.kanjiIds?.length || 0;
      if (kanjiProgressData.completedIndices && kanjiCount > 0) {
        const kanjiProgressPercent =
          (kanjiProgressData.completedIndices.length / kanjiCount) * 100;
        setKanjiProgress(kanjiProgressPercent);
      } else {
        setKanjiProgress(0);
      }
    } else {
      setKanjiTestPassed(false);
      setKanjiProgress(0);
    }

    // Load grammar progress and test status
    const grammarProgressData = loadProgress("grammar", dateKey);
    if (grammarProgressData) {
      setGrammarTestPassed(grammarProgressData.testPassed || false);
      // Calculate progress from completedIndices
      const grammarCount = dailyState.assigned.grammarIds?.length || 0;
      if (grammarProgressData.completedIndices && grammarCount > 0) {
        const grammarProgressPercent =
          (grammarProgressData.completedIndices.length / grammarCount) * 100;
        setGrammarProgress(grammarProgressPercent);
      } else {
        setGrammarProgress(0);
      }
    } else {
      setGrammarTestPassed(false);
      setGrammarProgress(0);
    }
  }, [dailyState?.checkedInAt, dailyState?.assigned, storedDateKey]);

  // Save vocabTestPassed to localStorage when it changes
  useEffect(() => {
    if (!dailyState?.checkedInAt || !storedDateKey) return;

    const checkedInDate = new Date(dailyState.checkedInAt);
    const dateKey = checkedInDate.toISOString().split("T")[0];

    if (storedDateKey === dateKey) {
      // saveProgress already merges with existing progress
      saveProgress("vocab", dateKey, {
        testPassed: vocabTestPassed,
      });
    }
  }, [vocabTestPassed, dailyState?.checkedInAt, storedDateKey]);

  // Save kanjiTestPassed to localStorage when it changes
  useEffect(() => {
    if (!dailyState?.checkedInAt || !storedDateKey) return;

    const checkedInDate = new Date(dailyState.checkedInAt);
    const dateKey = checkedInDate.toISOString().split("T")[0];

    if (storedDateKey === dateKey) {
      // saveProgress already merges with existing progress
      saveProgress("kanji", dateKey, {
        testPassed: kanjiTestPassed,
      });
    }
  }, [kanjiTestPassed, dailyState?.checkedInAt, storedDateKey]);

  // Unlock kanji when vocab is 100% complete AND test is 100% correct
  const isKanjiUnlocked = vocabProgress >= 100 && vocabTestPassed;
  // Unlock grammar when kanji is 100% complete AND test is 100% correct
  const isGrammarUnlocked = kanjiProgress >= 100 && kanjiTestPassed;

  // grammarTestPassed is used in the grammar lesson component and saved to localStorage
  // It will be used for future unlock logic when we add more lessons
  console.log("Grammar test passed:", grammarTestPassed);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-6xl h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {activeTab === "vocabulary" && "Vocabulary Lesson"}
            {activeTab === "kanji" && "Kanji Lesson"}
            {activeTab === "grammar" && "Grammar Lesson"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 px-6 py-3 bg-gray-50 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("vocabulary")}
            className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === "vocabulary"
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            Vocabulary
            {vocabProgress >= 100 && (
              <Check className="w-4 h-4 text-green-500 bg-white rounded-full" />
            )}
          </button>
          <button
            onClick={() => isKanjiUnlocked && setActiveTab("kanji")}
            disabled={!isKanjiUnlocked}
            title={
              !isKanjiUnlocked
                ? "Hoàn thành từ vựng và bài test để mở khóa"
                : ""
            }
            className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 cursor-pointer ${
              isKanjiUnlocked
                ? activeTab === "kanji"
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            Kanji
            {isKanjiUnlocked && kanjiProgress >= 100 && (
              <Check className="w-4 h-4 text-green-500 bg-white rounded-full" />
            )}
            {!isKanjiUnlocked && <Lock className="w-4 h-4" />}
          </button>
          <button
            onClick={() => isGrammarUnlocked && setActiveTab("grammar")}
            disabled={!isGrammarUnlocked}
            title={
              !isGrammarUnlocked
                ? "Hoàn thành kanji và bài test để mở khóa"
                : ""
            }
            className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 cursor-pointer ${
              isGrammarUnlocked
                ? activeTab === "grammar"
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            Grammar
            {isGrammarUnlocked &&
              grammarProgress >= 100 &&
              grammarTestPassed && (
                <Check className="w-4 h-4 text-green-500 bg-white rounded-full" />
              )}
            {!isGrammarUnlocked && <Lock className="w-4 h-4" />}
          </button>
        </div>

        {/* Content */}
        <div className="h-[calc(100%-140px)] overflow-hidden">
          {activeTab === "vocabulary" && (
            <VocabularyLesson
              onProgressChange={setVocabProgress}
              onTestComplete={(score, total) => {
                const isPerfect = score === total;
                setVocabTestPassed(isPerfect);
                // Save to localStorage (also saved by VocabularyLesson, but ensure sync)
                if (dailyState?.checkedInAt) {
                  const checkedInDate = new Date(dailyState.checkedInAt);
                  const dateKey = checkedInDate.toISOString().split("T")[0];
                  // saveProgress already merges with existing progress
                  saveProgress("vocab", dateKey, {
                    testPassed: isPerfect,
                    testScore: score,
                    testTotal: total,
                  });
                }
              }}
              unlockNext={() => {
                // Ensure vocabTestPassed is set to true to unlock kanji
                // The unlock state is computed from vocabProgress >= 100 && vocabTestPassed
                // onTestComplete already sets vocabTestPassed, but we ensure it here as well
                // This ensures the unlock happens immediately when the callback is triggered
                if (vocabProgress >= 100) {
                  setVocabTestPassed(true);
                  // Save to localStorage
                  if (dailyState?.checkedInAt) {
                    const checkedInDate = new Date(dailyState.checkedInAt);
                    const dateKey = checkedInDate.toISOString().split("T")[0];
                    // saveProgress already merges with existing progress
                    saveProgress("vocab", dateKey, {
                      testPassed: true,
                    });
                  }
                }
                // Don't switch tab automatically - user can manually switch to kanji tab
              }}
              nextLessonName="Kanji"
            />
          )}
          {activeTab === "kanji" &&
            (isKanjiUnlocked ? (
              <KanjiLesson
                onProgressChange={setKanjiProgress}
                onTestComplete={(score, total) => {
                  const isPerfect = score === total;
                  setKanjiTestPassed(isPerfect);
                  // Save to localStorage (also saved by KanjiLesson, but ensure sync)
                  if (dailyState?.checkedInAt) {
                    const checkedInDate = new Date(dailyState.checkedInAt);
                    const dateKey = checkedInDate.toISOString().split("T")[0];
                    // saveProgress already merges with existing progress
                    saveProgress("kanji", dateKey, {
                      testPassed: isPerfect,
                      testScore: score,
                      testTotal: total,
                    });
                  }
                }}
                unlockNext={() => {
                  // Ensure kanjiTestPassed is set to true to unlock grammar
                  // The unlock state is computed from kanjiProgress >= 100 && kanjiTestPassed
                  // onTestComplete already sets kanjiTestPassed, but we ensure it here as well
                  // This ensures the unlock happens immediately when the callback is triggered
                  if (kanjiProgress >= 100) {
                    setKanjiTestPassed(true);
                    // Save to localStorage
                    if (dailyState?.checkedInAt) {
                      const checkedInDate = new Date(dailyState.checkedInAt);
                      const dateKey = checkedInDate.toISOString().split("T")[0];
                      // saveProgress already merges with existing progress
                      saveProgress("kanji", dateKey, {
                        testPassed: true,
                      });
                    }
                  }
                  // Don't switch tab automatically - user can manually switch to grammar tab
                }}
                nextLessonName="Grammar"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <Lock className="w-16 h-16 mx-auto mb-4" />
                  <p className="text-xl mb-2">
                    Complete Vocabulary and pass test 100% to unlock Kanji
                  </p>
                  <p className="text-sm">
                    Progress: {Math.round(vocabProgress)}%
                  </p>
                  {vocabProgress >= 100 && !vocabTestPassed && (
                    <p className="text-sm text-red-500 mt-2">
                      Test: Not passed 100% yet
                    </p>
                  )}
                  {vocabTestPassed && (
                    <p className="text-sm text-green-500 mt-2">
                      Test: Passed 100% ✓
                    </p>
                  )}
                </div>
              </div>
            ))}
          {activeTab === "grammar" &&
            (isGrammarUnlocked ? (
              <GrammarLesson
                onProgressChange={setGrammarProgress}
                onTestComplete={(score, total) => {
                  const isPerfect = score === total;
                  setGrammarTestPassed(isPerfect);
                  // Save to localStorage (also saved by GrammarLesson, but ensure sync)
                  if (dailyState?.checkedInAt) {
                    const checkedInDate = new Date(dailyState.checkedInAt);
                    const dateKey = checkedInDate.toISOString().split("T")[0];
                    // saveProgress already merges with existing progress
                    saveProgress("grammar", dateKey, {
                      testPassed: isPerfect,
                      testScore: score,
                      testTotal: total,
                    });
                  }

                  // Show notification if all lessons completed 100%
                  if (
                    isPerfect &&
                    vocabProgress >= 100 &&
                    vocabTestPassed &&
                    kanjiProgress >= 100 &&
                    kanjiTestPassed &&
                    grammarProgress >= 100
                  ) {
                    toast.success("🎉 Hoàn thành bài học hôm nay!", {
                      description:
                        "Bạn đã hoàn thành tất cả bài học với điểm số tuyệt đối!",
                      duration: 5000,
                      position: "bottom-right",
                    });
                  }
                }}
                unlockNext={() => {
                  // Ensure grammarTestPassed is set to true
                  // The unlock state is computed from grammarProgress >= 100 && grammarTestPassed
                  // onTestComplete already sets grammarTestPassed, but we ensure it here as well
                  // This ensures the unlock happens immediately when the callback is triggered
                  if (grammarProgress >= 100) {
                    setGrammarTestPassed(true);
                    // Save to localStorage
                    if (dailyState?.checkedInAt) {
                      const checkedInDate = new Date(dailyState.checkedInAt);
                      const dateKey = checkedInDate.toISOString().split("T")[0];
                      // saveProgress already merges with existing progress
                      saveProgress("grammar", dateKey, {
                        testPassed: true,
                      });
                    }
                  }
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <Lock className="w-16 h-16 mx-auto mb-4" />
                  <p className="text-xl mb-2">
                    Complete Kanji and pass test 100% to unlock Grammar
                  </p>
                  <p className="text-sm">
                    Progress: {Math.round(kanjiProgress)}%
                  </p>
                  {kanjiProgress >= 100 && !kanjiTestPassed && (
                    <p className="text-sm text-red-500 mt-2">
                      Test: Not passed 100% yet
                    </p>
                  )}
                  {kanjiTestPassed && (
                    <p className="text-sm text-green-500 mt-2">
                      Test: Passed 100% ✓
                    </p>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
