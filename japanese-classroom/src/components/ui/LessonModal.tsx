"use client";

import { useState, useEffect } from "react";
import { X, Lock, Check, FileText } from "lucide-react";
import { VocabularyLesson } from "./vocab";
import { KanjiLesson } from "./kanji";
import { GrammarLesson } from "./grammar";
import { useQuery } from "@tanstack/react-query";
import { attendanceApi } from "@/api/attendance-api";
import { loadProgress } from "@/utils/lesson-progress";

interface LessonModalProps {
  visible: boolean;
  onClose: () => void;
}

type LessonTab = "vocabulary" | "kanji" | "grammar";

export function LessonModal({ visible, onClose }: LessonModalProps) {
  const [activeTab, setActiveTab] = useState<LessonTab>("vocabulary");
  const [vocabProgress, setVocabProgress] = useState(0);
  const [kanjiProgress, setKanjiProgress] = useState(0);
  const [vocabTestPassed, setVocabTestPassed] = useState(false);
  const [kanjiTestPassed, setKanjiTestPassed] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [grammarTestPassed, setGrammarTestPassed] = useState(false); // Will be used for future grammar unlock logic

  // Fetch daily state to get checkedInAt date
  const { data: dailyState } = useQuery({
    queryKey: ["daily-state"],
    queryFn: () => attendanceApi.getStatus(),
  });

  // Load test results from localStorage when dailyState is available
  useEffect(() => {
    if (!dailyState?.checkedInAt) return;

    const checkedInDate = new Date(dailyState.checkedInAt);
    const dateKey = checkedInDate.toISOString().split("T")[0];

    const vocabProgress = loadProgress("vocab", dateKey);
    if (vocabProgress) {
      setVocabTestPassed(vocabProgress.testPassed || false);
    }

    const kanjiProgress = loadProgress("kanji", dateKey);
    if (kanjiProgress) {
      setKanjiTestPassed(kanjiProgress.testPassed || false);
    }

    const grammarProgress = loadProgress("grammar", dateKey);
    if (grammarProgress) {
      setGrammarTestPassed(grammarProgress.testPassed || false);
    }
  }, [dailyState?.checkedInAt]);

  // Unlock kanji when vocab is 100% complete AND test is 100% correct
  const isKanjiUnlocked = vocabProgress >= 100 && vocabTestPassed;
  // Unlock grammar when kanji is 100% complete AND test is 100% correct
  const isGrammarUnlocked = kanjiProgress >= 100 && kanjiTestPassed;

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
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 px-6 py-3 bg-gray-50 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("vocabulary")}
            className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
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
            className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
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
            className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              isGrammarUnlocked
                ? activeTab === "grammar"
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            Grammar
            {isGrammarUnlocked && <FileText className="w-4 h-4" />}
            {!isGrammarUnlocked && <Lock className="w-4 h-4" />}
          </button>
        </div>

        {/* Content */}
        <div className="h-[calc(100%-140px)] overflow-hidden">
          {activeTab === "vocabulary" && (
            <VocabularyLesson
              onProgressChange={setVocabProgress}
              onTestComplete={(score, total) => {
                setVocabTestPassed(score === total);
              }}
              unlockNext={() => {
                // Always switch to kanji tab when unlock is called
                // (only called when test is 100% perfect)
                setActiveTab("kanji");
              }}
              nextLessonName="Kanji"
            />
          )}
          {activeTab === "kanji" &&
            (isKanjiUnlocked ? (
              <KanjiLesson
                onProgressChange={setKanjiProgress}
                onTestComplete={(score, total) => {
                  setKanjiTestPassed(score === total);
                }}
                unlockNext={() => {
                  // Just unlock grammar, don't switch tab automatically
                  // User can manually switch to grammar tab if they want
                }}
                nextLessonName="Ngữ pháp"
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
                onTestComplete={(score, total) => {
                  setGrammarTestPassed(score === total);
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
