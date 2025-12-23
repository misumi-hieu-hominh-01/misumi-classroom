"use client";

import { useState, useEffect, useMemo } from "react";
import { KanjiItem } from "@/api/content-api";
import { X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { attendanceApi } from "@/api/attendance-api";
import { loadProgress } from "@/utils/lesson-progress";
import { KanjiTestResult } from "./KanjiTestResult";
import { KanjiStrokeOrderTest } from "./KanjiStrokeOrderTest";

// Sample data for wrong answers to avoid duplicates
const SAMPLE_READINGS = [
  "い",
  "う",
  "え",
  "お",
  "か",
  "き",
  "く",
  "け",
  "こ",
  "さ",
  "し",
  "す",
  "せ",
  "そ",
  "た",
  "ち",
  "つ",
  "て",
  "と",
  "な",
  "に",
  "ぬ",
  "ね",
  "の",
  "は",
  "ひ",
  "ふ",
  "へ",
  "ほ",
  "ま",
  "み",
  "む",
  "め",
  "も",
  "や",
  "ゆ",
  "よ",
  "ら",
  "り",
  "る",
  "れ",
  "ろ",
  "わ",
  "を",
  "ん",
  "あん",
  "いん",
  "うん",
  "えん",
  "おん",
  "かん",
  "きん",
  "くん",
  "けん",
  "こん",
  "さん",
  "しん",
  "すん",
  "せん",
  "そん",
  "たん",
  "ちん",
  "つん",
  "てん",
  "とん",
  "なん",
  "にん",
  "ぬん",
  "ねん",
  "のん",
  "はん",
  "ひん",
  "ふん",
  "へん",
  "ほん",
  "まん",
  "みん",
  "むん",
  "めん",
  "もん",
  "やん",
  "ゆん",
  "よん",
  "らん",
  "りん",
  "るん",
  "れん",
  "ろん",
  "わん",
  "をん",
];

interface KanjiQuestion {
  kanjiId: string;
  kanji: string;
  questionType: "strokeOrder" | "reading";
  readingType?: "onyomi" | "kunyomi";
  correctAnswer: string;
  options?: string[];
  correctIndex?: number;
  isCompleted?: boolean;
}

interface KanjiTestProps {
  kanjis: KanjiItem[];
  onClose: () => void;
  onTestComplete?: (score: number, total: number) => void;
  unlockNext?: () => void;
  nextLessonName?: string;
}

export function KanjiTest({
  kanjis,
  onClose,
  onTestComplete,
  unlockNext,
  nextLessonName,
}: KanjiTestProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Map<number, number>>(
    new Map()
  );
  const [strokeOrderCompleted, setStrokeOrderCompleted] = useState<
    Map<number, boolean>
  >(new Map());
  const [showResult, setShowResult] = useState(false);
  const [isRetryMode, setIsRetryMode] = useState(false);

  // Fetch daily state to get checkedInAt date
  const { data: dailyState } = useQuery({
    queryKey: ["daily-state"],
    queryFn: () => attendanceApi.getStatus(),
  });

  // Shuffle kanjis
  const shuffledKanjis = useMemo(() => {
    return [...kanjis].sort(() => Math.random() - 0.5);
  }, [kanjis]);

  // Generate questions: 2 questions per kanji (meaning + reading)
  const questions = useMemo(() => {
    const allQuestions: KanjiQuestion[] = [];

    shuffledKanjis.forEach((kanji) => {
      // Question 1: Stroke Order Test
      allQuestions.push({
        kanjiId: kanji._id,
        kanji: kanji.kanji,
        questionType: "strokeOrder",
        correctAnswer: "completed", // Will be set to "completed" when all strokes are done correctly
        isCompleted: false,
      });

      // Question 2: Reading (random onyomi or kunyomi)
      const hasOnyomi = kanji.onyomi && kanji.onyomi.length > 0;
      const hasKunyomi = kanji.kunyomi && kanji.kunyomi.length > 0;

      if (hasOnyomi || hasKunyomi) {
        let readingType: "onyomi" | "kunyomi";
        let correctReading: string;

        if (hasOnyomi && hasKunyomi) {
          // Random choose onyomi or kunyomi
          readingType = Math.random() > 0.5 ? "onyomi" : "kunyomi";
          correctReading =
            readingType === "onyomi" ? kanji.onyomi![0] : kanji.kunyomi![0];
        } else if (hasOnyomi) {
          readingType = "onyomi";
          correctReading = kanji.onyomi![0];
        } else {
          readingType = "kunyomi";
          correctReading = kanji.kunyomi![0];
        }

        // Collect all readings from other kanjis
        const otherKanjis = shuffledKanjis.filter((k) => k._id !== kanji._id);
        const allReadings: string[] = [];
        otherKanjis.forEach((otherKanji) => {
          if (otherKanji.onyomi) allReadings.push(...otherKanji.onyomi);
          if (otherKanji.kunyomi) allReadings.push(...otherKanji.kunyomi);
        });

        // Combine with sample readings and filter out correct answer
        const allWrongReadings = [...allReadings, ...SAMPLE_READINGS].filter(
          (r) => r !== correctReading
        );

        // Remove duplicates and shuffle
        const uniqueWrongReadings = Array.from(new Set(allWrongReadings)).sort(
          () => Math.random() - 0.5
        );

        // Create options
        const readingOptions: string[] = [correctReading];

        // Take 3 unique wrong readings
        const selectedWrongReadings: string[] = [];
        for (const wrong of uniqueWrongReadings) {
          if (
            !selectedWrongReadings.includes(wrong) &&
            selectedWrongReadings.length < 3
          ) {
            selectedWrongReadings.push(wrong);
          }
        }

        // If still not enough, use sample data
        while (selectedWrongReadings.length < 3) {
          const randomSample =
            SAMPLE_READINGS[Math.floor(Math.random() * SAMPLE_READINGS.length)];
          if (
            randomSample !== correctReading &&
            !selectedWrongReadings.includes(randomSample)
          ) {
            selectedWrongReadings.push(randomSample);
          }
        }

        readingOptions.push(...selectedWrongReadings);

        // Shuffle options
        const shuffledReadingOptions = readingOptions.sort(
          () => Math.random() - 0.5
        );
        const correctReadingIndex =
          shuffledReadingOptions.indexOf(correctReading);

        allQuestions.push({
          kanjiId: kanji._id,
          kanji: kanji.kanji,
          questionType: "reading",
          readingType,
          correctAnswer: correctReading,
          options: shuffledReadingOptions,
          correctIndex: correctReadingIndex,
        });
      }
    });

    return allQuestions;
  }, [shuffledKanjis]);

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

  // Get kanji item for current question to access strokes
  const currentKanjiItem = useMemo(() => {
    if (!currentQuestion) return null;
    return shuffledKanjis.find((k) => k._id === currentQuestion.kanjiId);
  }, [currentQuestion, shuffledKanjis]);

  // Load test progress from localStorage when component mounts
  useEffect(() => {
    if (!dailyState?.checkedInAt || questions.length === 0) return;

    const checkedInDate = new Date(dailyState.checkedInAt);
    const dateKey = checkedInDate.toISOString().split("T")[0];
    const savedProgress = loadProgress("kanji", dateKey);

    // If test was already passed 100%, auto-complete all questions
    if (
      savedProgress?.testPassed &&
      savedProgress.testScore !== undefined &&
      savedProgress.testTotal !== undefined &&
      savedProgress.testScore === savedProgress.testTotal &&
      savedProgress.testTotal === totalQuestions
    ) {
      // Mark all stroke order questions as completed
      const completedMap = new Map<number, boolean>();
      const answersMap = new Map<number, number>();

      questions.forEach((question, index) => {
        if (question.questionType === "strokeOrder") {
          completedMap.set(index, true);
        } else if (
          question.questionType === "reading" &&
          question.correctIndex !== undefined
        ) {
          // For reading questions, set the correct answer
          answersMap.set(index, question.correctIndex);
        }
      });

      setStrokeOrderCompleted(completedMap);
      setSelectedAnswers(answersMap);

      // Auto show results if all questions are completed
      const allCompleted =
        completedMap.size ===
          questions.filter((q) => q.questionType === "strokeOrder").length &&
        answersMap.size ===
          questions.filter((q) => q.questionType === "reading").length;

      if (allCompleted) {
        // Don't auto show results, let user see the completed state
        // They can manually go to results if they want
      }
    }
  }, [dailyState?.checkedInAt, questions, totalQuestions]);

  function handleAnswerSelect(optionIndex: number) {
    setSelectedAnswers((prev) => {
      const newMap = new Map(prev);
      newMap.set(currentQuestionIndex, optionIndex);
      return newMap;
    });
  }

  function handleStrokeOrderComplete() {
    // Mark stroke order question as completed
    setStrokeOrderCompleted((prev) => {
      const newMap = new Map(prev);
      newMap.set(currentQuestionIndex, true);
      return newMap;
    });

    // Auto move to next question after a short delay
    setTimeout(() => {
      handleNext();
    }, 500);
  }

  function handleStrokeOrderSkip() {
    // Mark stroke order question as completed (skip)
    setStrokeOrderCompleted((prev) => {
      const newMap = new Map(prev);
      newMap.set(currentQuestionIndex, true);
      return newMap;
    });

    // Auto move to next question
    handleNext();
  }

  function handleNext() {
    if (isLastQuestion) {
      // Show results
      setShowResult(true);
    } else {
      // Find next question, skip completed stroke order questions
      let nextIndex = currentQuestionIndex + 1;
      while (nextIndex < totalQuestions) {
        const nextQuestion = questions[nextIndex];
        // If it's a completed stroke order question, skip it
        if (
          nextQuestion.questionType === "strokeOrder" &&
          strokeOrderCompleted.get(nextIndex)
        ) {
          nextIndex++;
        } else {
          break;
        }
      }
      if (nextIndex < totalQuestions) {
        setCurrentQuestionIndex(nextIndex);
      } else {
        // All remaining questions are completed stroke orders, show results
        setShowResult(true);
      }
    }
  }

  function handlePrevious() {
    if (currentQuestionIndex > 0) {
      // Find previous question, skip completed stroke order questions
      let prevIndex = currentQuestionIndex - 1;
      while (prevIndex >= 0) {
        const prevQuestion = questions[prevIndex];
        // If it's a completed stroke order question, skip it
        if (
          prevQuestion.questionType === "strokeOrder" &&
          strokeOrderCompleted.get(prevIndex)
        ) {
          prevIndex--;
        } else {
          break;
        }
      }
      if (prevIndex >= 0) {
        setCurrentQuestionIndex(prevIndex);
      } else {
        // All previous questions are completed stroke orders, go to first question
        setCurrentQuestionIndex(0);
      }
    }
  }

  // Auto-skip completed stroke order questions when navigating
  useEffect(() => {
    if (!currentQuestion) return;

    if (
      currentQuestion.questionType === "strokeOrder" &&
      strokeOrderCompleted.get(currentQuestionIndex)
    ) {
      // Auto skip to next question after a short delay
      const timer = setTimeout(() => {
        if (isLastQuestion) {
          setShowResult(true);
        } else {
          let nextIndex = currentQuestionIndex + 1;
          while (nextIndex < totalQuestions) {
            const nextQuestion = questions[nextIndex];
            if (
              nextQuestion.questionType === "strokeOrder" &&
              strokeOrderCompleted.get(nextIndex)
            ) {
              nextIndex++;
            } else {
              break;
            }
          }
          if (nextIndex < totalQuestions) {
            setCurrentQuestionIndex(nextIndex);
          } else {
            setShowResult(true);
          }
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [
    currentQuestionIndex,
    currentQuestion,
    strokeOrderCompleted,
    questions,
    isLastQuestion,
    totalQuestions,
  ]);

  function handleConfirm() {
    const currentQ = questions[currentQuestionIndex];
    if (currentQ.questionType === "strokeOrder") {
      // For stroke order, check if completed
      if (strokeOrderCompleted.has(currentQuestionIndex)) {
        handleNext();
      }
    } else {
      // For reading questions, check if answer selected
      if (selectedAnswers.has(currentQuestionIndex)) {
        handleNext();
      }
    }
  }

  // Calculate score
  const correctAnswers = useMemo(() => {
    let correct = 0;
    questions.forEach((question, index) => {
      if (question.questionType === "strokeOrder") {
        // Stroke order question is correct if completed
        if (strokeOrderCompleted.get(index)) {
          correct++;
        }
      } else {
        // Reading question
        const selectedIndex = selectedAnswers.get(index);
        if (
          selectedIndex !== undefined &&
          selectedIndex === question.correctIndex
        ) {
          correct++;
        }
      }
    });
    return correct;
  }, [questions, selectedAnswers, strokeOrderCompleted]);

  if (showResult) {
    return (
      <KanjiTestResult
        totalQuestions={totalQuestions}
        correctAnswers={correctAnswers}
        questions={questions}
        selectedAnswers={selectedAnswers}
        strokeOrderCompleted={strokeOrderCompleted}
        kanjis={shuffledKanjis}
        onRetry={() => {
          setShowResult(false);
          setCurrentQuestionIndex(0);
          setSelectedAnswers(new Map());
          // Keep completed stroke orders, don't reset them
          setIsRetryMode(true);
        }}
        onClose={onClose}
        onTestComplete={onTestComplete}
        unlockNext={unlockNext}
        nextLessonName={nextLessonName}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Kiểm tra Kanji</h2>
            <p className="text-sm text-gray-600 mt-1">
              Câu {currentQuestionIndex + 1}/{totalQuestions}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Question Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {currentQuestion && (
            <div className="max-w-3xl mx-auto space-y-8">
              {/* Kanji Display */}
              <div className="text-center">
                {currentQuestion.questionType === "strokeOrder" ? (
                  // Check if already completed, if so skip automatically
                  strokeOrderCompleted.get(currentQuestionIndex) ? (
                    <div className="mb-6 space-y-4">
                      <div className="h-96 w-full max-w-2xl mx-auto flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-6xl mb-4">✓</div>
                          <p className="text-lg text-green-600 font-semibold">
                            Đã hoàn thành nét vẽ
                          </p>
                          <p className="text-sm text-gray-500 mt-2">
                            Tự động chuyển sang câu tiếp theo...
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Show stroke order test
                    <div className="mb-6 space-y-4">
                      <div className="h-96 w-full max-w-2xl mx-auto">
                        <KanjiStrokeOrderTest
                          kanji={currentQuestion.kanji}
                          strokes={currentKanjiItem?.strokes}
                          onComplete={handleStrokeOrderComplete}
                          onSkip={handleStrokeOrderSkip}
                          isRetry={isRetryMode}
                        />
                      </div>
                    </div>
                  )
                ) : (
                  // Show text for reading questions
                  <>
                    <div className="text-8xl font-medium text-gray-900 mb-4">
                      {currentQuestion.kanji}
                    </div>
                    <div className="text-lg text-gray-600">
                      Âm đọc{" "}
                      {currentQuestion.readingType === "onyomi"
                        ? "on'yomi"
                        : "kun'yomi"}{" "}
                      của kanji này là gì?
                    </div>
                  </>
                )}
              </div>

              {/* Answer Options - Only show for reading questions */}
              {currentQuestion.questionType === "reading" &&
                currentQuestion.options && (
                  <div className="grid grid-cols-2 gap-4">
                    {currentQuestion.options.map((option, index) => {
                      const isSelected =
                        selectedAnswers.get(currentQuestionIndex) === index;
                      return (
                        <button
                          key={index}
                          onClick={() => handleAnswerSelect(index)}
                          className={`p-6 rounded-xl border-2 text-left transition-all ${
                            isSelected
                              ? "border-blue-500 bg-blue-50 shadow-md"
                              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                                isSelected
                                  ? "bg-blue-500 text-white"
                                  : "bg-gray-200 text-gray-600"
                              }`}
                            >
                              {String.fromCharCode(97 + index)}
                            </div>
                            <div className="text-lg font-medium text-gray-900">
                              {option}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex items-center justify-between gap-4 max-w-3xl mx-auto">
            {/* Progress Bar */}
            <div className="flex-1 max-w-xs">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600">
                  Đã trả lời:{" "}
                  {selectedAnswers.size +
                    Array.from(strokeOrderCompleted.values()).filter(Boolean)
                      .length}
                  /{totalQuestions}
                </span>
                <span className="font-semibold text-gray-900">
                  {Math.round((selectedAnswers.size / totalQuestions) * 100)}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                  style={{
                    width: `${
                      ((selectedAnswers.size +
                        Array.from(strokeOrderCompleted.values()).filter(
                          Boolean
                        ).length) /
                        totalQuestions) *
                      100
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handlePrevious}
                disabled={
                  currentQuestionIndex === 0 ||
                  (currentQuestionIndex === 1 &&
                    questions[0]?.questionType === "strokeOrder" &&
                    strokeOrderCompleted.get(0))
                }
                className="px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trước
              </button>
              <button
                onClick={handleConfirm}
                disabled={
                  currentQuestion.questionType === "strokeOrder"
                    ? !strokeOrderCompleted.has(currentQuestionIndex)
                    : !selectedAnswers.has(currentQuestionIndex)
                }
                className={`px-8 py-3 rounded-xl font-semibold text-white transition-all ${
                  currentQuestion.questionType === "strokeOrder"
                    ? strokeOrderCompleted.has(currentQuestionIndex)
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg"
                      : "bg-gray-300 cursor-not-allowed"
                    : selectedAnswers.has(currentQuestionIndex)
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg"
                    : "bg-gray-300 cursor-not-allowed"
                }`}
              >
                {isLastQuestion ? "Xem kết quả" : "Tiếp theo"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
