"use client";

import { useState } from "react";
import { KanjiItem } from "@/api/content-api";
import {
  Trophy,
  X,
  CheckCircle,
  XCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface KanjiQuestion {
  kanjiId: string;
  kanji: string;
  questionType: "strokeOrder" | "multiReading";
  subQuestions?: {
    type: "hanviet" | "meaning" | "onyomi" | "kunyomi";
    question: string;
    correctAnswer: string;
    rowIndex: number;
  }[];
  allOptions?: string[][];
  isCompleted?: boolean;
}

interface KanjiTestResultProps {
  totalQuestions: number;
  correctAnswers: number;
  questions: KanjiQuestion[];
  selectedAnswers: Map<number, Map<number, number>>;
  strokeOrderCompleted?: Map<number, boolean>;
  kanjis: KanjiItem[];
  onRetry: () => void;
  onClose: () => void;
  onTestComplete?: (score: number, total: number) => void;
  unlockNext?: () => void;
  nextLessonName?: string;
}

export function KanjiTestResult({
  totalQuestions: _totalQuestions, // eslint-disable-line @typescript-eslint/no-unused-vars
  correctAnswers: _correctAnswers, // eslint-disable-line @typescript-eslint/no-unused-vars
  questions,
  selectedAnswers,
  strokeOrderCompleted = new Map(),
  kanjis: _kanjis, // eslint-disable-line @typescript-eslint/no-unused-vars
  onRetry,
  onClose,
  onTestComplete,
  unlockNext,
  nextLessonName,
}: KanjiTestResultProps) {
  const [showDetails, setShowDetails] = useState(false);

  // Calculate total sub-questions (stroke order + all sub-questions)
  const totalSubQuestions = questions.reduce((total, q) => {
    if (q.questionType === "strokeOrder") return total + 1;
    if (q.questionType === "multiReading")
      return total + (q.subQuestions?.length || 0);
    return total;
  }, 0);

  // Recalculate correct answers to ensure accuracy
  const recalculatedCorrectAnswers = questions.reduce(
    (correct, question, index) => {
      if (question.questionType === "strokeOrder") {
        // Stroke order question is correct if completed
        if (strokeOrderCompleted.get(index)) {
          return correct + 1;
        }
      } else if (question.questionType === "multiReading") {
        // Multi-reading question - each sub-question counts as 1
        const subMap = selectedAnswers.get(index);
        if (subMap && question.subQuestions && question.allOptions) {
          question.subQuestions.forEach((subQ, subIndex) => {
            const selectedIndex = subMap.get(subIndex);
            if (selectedIndex !== undefined) {
              const selectedAnswer =
                question.allOptions![subQ.rowIndex][selectedIndex];
              if (selectedAnswer === subQ.correctAnswer) {
                correct++;
              }
            }
          });
        }
      }
      return correct;
    },
    0
  );

  // Use recalculated values for display
  const finalCorrectAnswers = recalculatedCorrectAnswers;
  const finalTotalQuestions = totalSubQuestions;

  const percentage =
    finalTotalQuestions > 0
      ? Math.round((finalCorrectAnswers / finalTotalQuestions) * 100)
      : 0;
  const isPassed = percentage >= 70;
  const isPerfect = percentage === 100;

  // Get performance message
  function getPerformanceMessage() {
    if (percentage === 100) return "Xuất sắc! Bạn làm bài hoàn hảo! 🎉";
    if (percentage >= 90) return "Tuyệt vời! Bạn làm rất tốt! 🌟";
    if (percentage >= 70) return "Khá tốt! Cố gắng thêm nhé! 👍";
    return "Cần cố gắng thêm! Hãy ôn lại bài nhé! 💪";
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-900">Kết quả kiểm tra</h2>
          <button
            onClick={() => {
              // If perfect, unlock before closing
              if (isPerfect && unlockNext) {
                unlockNext();
              }
              onClose();
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Score Display */}
          <div className="p-8 bg-gradient-to-br from-blue-50 to-purple-50 border-b border-gray-200">
            <div className="text-center space-y-4">
              <div
                className={`inline-flex p-4 rounded-full ${
                  isPassed ? "bg-green-100" : "bg-red-100"
                }`}
              >
                <Trophy
                  className={`w-16 h-16 ${
                    isPassed ? "text-green-500" : "text-red-500"
                  }`}
                />
              </div>

              <div>
                <div className="text-6xl font-bold text-gray-900 mb-2">
                  {percentage}%
                </div>
                <div className="text-xl text-gray-700 font-semibold">
                  {finalCorrectAnswers}/{finalTotalQuestions} câu đúng
                </div>
              </div>

              <div className="text-lg text-gray-600 font-medium">
                {getPerformanceMessage()}
              </div>

              {isPassed ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full font-semibold">
                  <CheckCircle className="w-5 h-5" />
                  Đạt yêu cầu
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-full font-semibold">
                  <XCircle className="w-5 h-5" />
                  Chưa đạt yêu cầu
                </div>
              )}
            </div>
          </div>

          {/* Detailed Results - Collapsible */}
          <div className="p-6 border-t border-gray-200">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <h3 className="text-lg font-semibold text-gray-900">
                Chi tiết đáp án
              </h3>
              {showDetails ? (
                <ChevronUp className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-600" />
              )}
            </button>

            {showDetails && (
              <div className="mt-4 space-y-3">
                {questions.map((question, idx) => {
                  if (question.questionType === "strokeOrder") {
                    const isCorrect = strokeOrderCompleted.get(idx) === true;

                    return (
                      <div
                        key={`${idx}-stroke`}
                        className={`p-4 rounded-xl border-2 ${
                          isCorrect
                            ? "border-green-300 bg-green-50"
                            : "border-red-300 bg-red-50"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 mt-1">
                            {isCorrect ? (
                              <CheckCircle className="w-6 h-6 text-green-600" />
                            ) : (
                              <XCircle className="w-6 h-6 text-red-600" />
                            )}
                          </div>
                          <div className="flex-1 space-y-3">
                            <div>
                              <div className="text-3xl font-medium text-gray-900 mb-2">
                                {question.kanji}
                              </div>
                              <p className="text-sm text-gray-600">
                                Nhớ nét vẽ kanji theo thứ tự đúng
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 mb-1">
                                Kết quả:
                              </p>
                              <p
                                className={`text-lg font-semibold ${
                                  isCorrect ? "text-green-700" : "text-red-700"
                                }`}
                              >
                                {isCorrect
                                  ? "✓ Đã hoàn thành đúng thứ tự nét vẽ"
                                  : "✗ Chưa hoàn thành"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  } else if (question.questionType === "multiReading") {
                    const subMap = selectedAnswers.get(idx);
                    return (
                      <div key={`${idx}-multi`} className="space-y-3">
                        {question.subQuestions?.map((subQ, subIdx) => {
                          const selectedIndex = subMap?.get(subIdx);
                          const isCorrect =
                            selectedIndex !== undefined &&
                            question.allOptions &&
                            question.allOptions[subQ.rowIndex][
                              selectedIndex
                            ] === subQ.correctAnswer;
                          const selectedAnswer =
                            selectedIndex !== undefined && question.allOptions
                              ? question.allOptions[subQ.rowIndex][
                                  selectedIndex
                                ]
                              : null;

                          const questionTypeLabel =
                            subQ.type === "hanviet"
                              ? "Hán Việt"
                              : subQ.type === "meaning"
                              ? "Nghĩa"
                              : subQ.type === "onyomi"
                              ? "On'yomi"
                              : "Kun'yomi";

                          return (
                            <div
                              key={`${idx}-${subIdx}`}
                              className={`p-4 rounded-xl border-2 ${
                                isCorrect
                                  ? "border-green-300 bg-green-50"
                                  : "border-red-300 bg-red-50"
                              }`}
                            >
                              <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 mt-1">
                                  {isCorrect ? (
                                    <CheckCircle className="w-6 h-6 text-green-600" />
                                  ) : (
                                    <XCircle className="w-6 h-6 text-red-600" />
                                  )}
                                </div>
                                <div className="flex-1 space-y-3">
                                  <div>
                                    <div className="text-3xl font-medium text-gray-900 mb-2">
                                      {question.kanji}
                                    </div>
                                    <p className="text-sm text-gray-600">
                                      {subQ.question} ({questionTypeLabel})
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <div className="flex-1">
                                      <p className="text-sm text-gray-600 mb-1">
                                        Đáp án đúng:
                                      </p>
                                      <p className="text-lg font-semibold text-green-700">
                                        {subQ.correctAnswer}
                                      </p>
                                    </div>
                                    <div className="text-2xl text-gray-400">
                                      →
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-sm text-gray-600 mb-1">
                                        Bạn chọn:
                                      </p>
                                      <p
                                        className={`text-lg font-semibold ${
                                          isCorrect
                                            ? "text-green-700"
                                            : "text-red-700"
                                        }`}
                                      >
                                        {selectedAnswer || "Chưa trả lời"}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex gap-3 justify-end">
            {isPerfect && unlockNext && nextLessonName ? (
              <>
                <button
                  onClick={() => {
                    if (onTestComplete) {
                      onTestComplete(finalCorrectAnswers, finalTotalQuestions);
                    }
                    unlockNext();
                    onClose();
                  }}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold hover:from-green-600 hover:to-green-700 shadow-lg transition-all flex items-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Mở khóa {nextLessonName}
                </button>
                <button
                  onClick={() => {
                    if (onTestComplete) {
                      onTestComplete(finalCorrectAnswers, finalTotalQuestions);
                    }
                    unlockNext();
                    onClose();
                  }}
                  className="px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-colors"
                >
                  Đóng
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    if (onTestComplete) {
                      onTestComplete(finalCorrectAnswers, finalTotalQuestions);
                    }
                    onClose();
                  }}
                  className="px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-colors"
                >
                  Đóng
                </button>
                {!isPassed && (
                  <button
                    onClick={onRetry}
                    className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold hover:from-blue-600 hover:to-blue-700 shadow-lg transition-all flex items-center gap-2"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Làm lại
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
