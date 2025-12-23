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
  questionType: "strokeOrder" | "reading";
  readingType?: "onyomi" | "kunyomi";
  correctAnswer: string;
  options?: string[];
  correctIndex?: number;
  isCompleted?: boolean;
}

interface KanjiTestResultProps {
  totalQuestions: number;
  correctAnswers: number;
  questions: KanjiQuestion[];
  selectedAnswers: Map<number, number>;
  strokeOrderCompleted?: Map<number, boolean>;
  kanjis: KanjiItem[];
  onRetry: () => void;
  onClose: () => void;
  onTestComplete?: (score: number, total: number) => void;
  unlockNext?: () => void;
  nextLessonName?: string;
}

export function KanjiTestResult({
  totalQuestions,
  correctAnswers,
  questions,
  selectedAnswers,
  strokeOrderCompleted = new Map(),
  kanjis,
  onRetry,
  onClose,
  onTestComplete,
  unlockNext,
  nextLessonName,
}: KanjiTestResultProps) {
  const [showDetails, setShowDetails] = useState(false);
  const percentage = Math.round((correctAnswers / totalQuestions) * 100);
  const isPassed = percentage >= 70;
  const isPerfect = percentage === 100;

  // Get performance message
  function getPerformanceMessage() {
    if (percentage === 100) return "Xuất sắc! Bạn làm bài hoàn hảo! 🎉";
    if (percentage >= 90) return "Tuyệt vời! Bạn làm rất tốt! 🌟";
    if (percentage >= 70) return "Khá tốt! Cố gắng thêm nhé! 👍";
    return "Cần cố gắng thêm! Hãy ôn lại bài nhé! 💪";
  }

  // Get kanji by ID
  function getKanjiById(kanjiId: string): KanjiItem | undefined {
    return kanjis.find((k) => k._id === kanjiId);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-900">Kết quả kiểm tra</h2>
          <button
            onClick={onClose}
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
                  {correctAnswers}/{totalQuestions} câu đúng
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
                  let isCorrect = false;
                  let selectedAnswer: string | null = null;

                  if (question.questionType === "strokeOrder") {
                    isCorrect = strokeOrderCompleted.get(idx) === true;
                    selectedAnswer = isCorrect
                      ? "Đã hoàn thành"
                      : "Chưa hoàn thành";
                  } else {
                    const selectedIndex = selectedAnswers.get(idx);
                    isCorrect =
                      selectedIndex !== undefined &&
                      selectedIndex === question.correctIndex;
                    selectedAnswer =
                      selectedIndex !== undefined && question.options
                        ? question.options[selectedIndex]
                        : null;
                  }

                  const kanji = getKanjiById(question.kanjiId);

                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border-2 ${
                        isCorrect
                          ? "border-green-300 bg-green-50"
                          : "border-red-300 bg-red-50"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className="flex-shrink-0 mt-1">
                          {isCorrect ? (
                            <CheckCircle className="w-6 h-6 text-green-600" />
                          ) : (
                            <XCircle className="w-6 h-6 text-red-600" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 space-y-3">
                          {/* Question */}
                          <div>
                            <div className="text-3xl font-medium text-gray-900 mb-2">
                              {question.kanji}
                            </div>
                            <p className="text-sm text-gray-600">
                              {question.questionType === "strokeOrder"
                                ? "Nhớ nét vẽ kanji theo thứ tự đúng"
                                : `Âm đọc ${
                                    question.readingType === "onyomi"
                                      ? "on&apos;yomi"
                                      : "kun&apos;yomi"
                                  } của kanji này là gì?`}
                            </p>
                          </div>

                          {/* Answer Comparison */}
                          {question.questionType === "strokeOrder" ? (
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
                          ) : (
                            <div className="flex items-center gap-4">
                              <div className="flex-1">
                                <p className="text-sm text-gray-600 mb-1">
                                  Đáp án đúng:
                                </p>
                                <p className="text-lg font-semibold text-green-700">
                                  {question.correctAnswer}
                                </p>
                              </div>
                              <div className="text-2xl text-gray-400">→</div>
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
                          )}

                          {/* Additional Info */}
                          {kanji && (
                            <div className="pt-2 border-t border-gray-200">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                {kanji.meaningVi &&
                                  kanji.meaningVi.length > 0 && (
                                    <div>
                                      <p className="text-gray-600 mb-1">
                                        Nghĩa:
                                      </p>
                                      <p className="font-medium text-gray-900">
                                        {kanji.meaningVi.join(", ")}
                                      </p>
                                    </div>
                                  )}
                                <div>
                                  <p className="text-gray-600 mb-1">Đọc:</p>
                                  <div className="space-y-1">
                                    {kanji.onyomi &&
                                      kanji.onyomi.length > 0 && (
                                        <p className="font-medium text-gray-900">
                                          On&apos;yomi:{" "}
                                          {kanji.onyomi.join(", ")}
                                        </p>
                                      )}
                                    {kanji.kunyomi &&
                                      kanji.kunyomi.length > 0 && (
                                        <p className="font-medium text-gray-900">
                                          Kun&apos;yomi:{" "}
                                          {kanji.kunyomi.join(", ")}
                                        </p>
                                      )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
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
                      onTestComplete(correctAnswers, totalQuestions);
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
                      onTestComplete(correctAnswers, totalQuestions);
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
                      onTestComplete(correctAnswers, totalQuestions);
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
