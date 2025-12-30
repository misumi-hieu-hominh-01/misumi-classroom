"use client";

import { useState, useMemo, useCallback } from "react";
import { X, ChevronRight, ChevronLeft } from "lucide-react";
import { GrammarPoint } from "@/api/content-api";
import { GrammarTestResult } from "./GrammarTestResult";
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToParentElement } from "@dnd-kit/modifiers";

interface GrammarTestProps {
  grammarPoints: GrammarPoint[];
  onClose: () => void;
  onTestComplete?: (score: number, total: number) => void;
  unlockNext?: () => void;
}

interface Question {
  grammarId: string;
  grammarTitle: string;
  originalSegments: string[];
  shuffledSegments: string[];
  userAnswer: string[];
}

function SortableItem({ id, segment }: { id: string; segment: string }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    animateLayoutChanges: () => false, // Tắt animation khi layout thay đổi để tránh "quay lại" vị trí cũ
  });

  const style = {
    // Dùng Transform để animation mượt mà hơn
    transform: CSS.Transform.toString(transform),
    // Chỉ dùng transition khi đang drag (để các item khác trượt mượt)
    // Tắt transition khi drag end để item "rớt" ngay vào vị trí mới
    transition: isDragging ? "none" : transition || "transform 200ms ease",
    // Chỉ mờ khi đang drag (để tạo hiệu ứng "bóng"), không mờ khi drop
    opacity: isDragging ? 0.3 : 1,
    // Đảm bảo item giữ kích thước cố định
    flexShrink: 0,
    minWidth: "fit-content",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="inline-flex items-center px-4 py-3 bg-white rounded-xl border-2 border-gray-200 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md hover:border-blue-400"
    >
      <span className="text-lg font-medium text-gray-900 select-none whitespace-nowrap">
        {segment}
      </span>
    </div>
  );
}

export function GrammarTest({
  grammarPoints,
  onClose,
  onTestComplete,
  unlockNext,
}: GrammarTestProps) {
  // Generate questions from grammar points
  const questions = useMemo(() => {
    const allQuestions: Question[] = [];

    grammarPoints.forEach((grammar) => {
      if (!grammar.examples || grammar.examples.length === 0) return;

      // Filter examples that have segments
      const examplesWithSegments = grammar.examples.filter(
        (ex) => ex.segments && ex.segments.length > 0
      );

      if (examplesWithSegments.length === 0) return;

      // Randomly select up to 3 examples
      const shuffled = [...examplesWithSegments].sort(
        () => Math.random() - 0.5
      );
      const selected = shuffled.slice(0, Math.min(3, shuffled.length));

      selected.forEach((example) => {
        const segments = example.segments!;
        const shuffledSegments = [...segments].sort(() => Math.random() - 0.5);

        allQuestions.push({
          grammarId: grammar._id,
          grammarTitle: grammar.title,
          originalSegments: segments,
          shuffledSegments,
          userAnswer: [...shuffledSegments],
        });
      });
    });

    return allQuestions;
  }, [grammarPoints]);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<number, string[]>>(new Map());
  const [showResult, setShowResult] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

  // Get current user answer (from answers map or initial shuffled)
  const currentAnswer = useMemo(
    () =>
      answers.get(currentQuestionIndex) || currentQuestion?.userAnswer || [],
    [answers, currentQuestionIndex, currentQuestion?.userAnswer]
  );

  // Setup sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over || active.id === over.id) {
        setActiveId(null);
        return;
      }

      // Find indices by segment content (since we use segment as id)
      const oldIndex = currentAnswer.findIndex((seg) => seg === active.id);
      const newIndex = currentAnswer.findIndex((seg) => seg === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newAnswer = arrayMove(currentAnswer, oldIndex, newIndex);
        const newAnswers = new Map(answers);
        newAnswers.set(currentQuestionIndex, newAnswer);
        setAnswers(newAnswers);
      }

      // Delay clearing activeId để đảm bảo drop animation hoàn thành
      setTimeout(() => {
        setActiveId(null);
      }, 0);
    },
    [currentAnswer, answers, currentQuestionIndex]
  );

  // Get active segment for overlay
  const activeSegment = useMemo(() => {
    if (!activeId) return null;
    return activeId as string;
  }, [activeId]);

  // Handle previous question
  const handlePrevious = useCallback(() => {
    if (currentQuestionIndex > 0) {
      // Save current answer before moving
      if (!answers.has(currentQuestionIndex)) {
        const newAnswers = new Map(answers);
        newAnswers.set(currentQuestionIndex, currentAnswer);
        setAnswers(newAnswers);
      }
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  }, [answers, currentQuestionIndex, currentAnswer]);

  // Handle next question
  const handleNext = useCallback(() => {
    // Save current answer
    if (!answers.has(currentQuestionIndex)) {
      const newAnswers = new Map(answers);
      newAnswers.set(currentQuestionIndex, currentAnswer);
      setAnswers(newAnswers);
    }

    if (isLastQuestion) {
      // Show result
      setShowResult(true);
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  }, [answers, currentQuestionIndex, currentAnswer, isLastQuestion]);

  // Calculate score
  const calculateScore = useCallback(() => {
    let correct = 0;
    questions.forEach((question, index) => {
      const userAnswer = answers.get(index) || question.userAnswer;
      const isCorrect =
        JSON.stringify(userAnswer) ===
        JSON.stringify(question.originalSegments);
      if (isCorrect) correct++;
    });
    return correct;
  }, [questions, answers]);

  if (showResult) {
    const correctAnswers = calculateScore();
    return (
      <GrammarTestResult
        totalQuestions={totalQuestions}
        correctAnswers={correctAnswers}
        questions={questions}
        answers={answers}
        onRetry={() => {
          setShowResult(false);
          setCurrentQuestionIndex(0);
          setAnswers(new Map());
        }}
        onClose={onClose}
        onTestComplete={onTestComplete}
        unlockNext={unlockNext}
      />
    );
  }

  if (!currentQuestion) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md">
          <p className="text-center text-gray-600">
            Không có câu hỏi nào. Vui lòng thêm segments vào examples của
            grammar.
          </p>
          <button
            onClick={onClose}
            className="mt-4 w-full px-6 py-3 rounded-xl bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">
              Kiểm tra ngữ pháp
            </h2>
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

        {/* Progress Bar */}
        <div className="px-6 pt-4 flex-shrink-0">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${
                  ((currentQuestionIndex + 1) / totalQuestions) * 100
                }%`,
              }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Grammar Title */}
            <div className="bg-blue-50 rounded-xl p-4 border-l-4 border-blue-500">
              <p className="text-sm text-blue-700 font-medium mb-1">
                Ngữ pháp:
              </p>
              <p className="text-lg font-bold text-gray-900">
                {currentQuestion.grammarTitle}
              </p>
            </div>

            {/* Draggable Segments */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">
                Kéo thả các từ để sắp xếp lại theo đúng thứ tự:
              </p>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                modifiers={[restrictToParentElement]} // Giới hạn kéo trong khung
              >
                <SortableContext
                  // QUAN TRỌNG: ID ở đây phải khớp với ID của các item và KHÔNG dựa vào index thay đổi
                  items={currentAnswer}
                  strategy={horizontalListSortingStrategy}
                >
                  <div className="flex flex-nowrap items-center gap-3 p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 min-h-[100px] overflow-x-auto overflow-y-hidden">
                    {currentAnswer.map((segment) => (
                      <SortableItem
                        key={segment} // Dùng segment làm key/id nếu các từ không trùng nhau
                        id={segment}
                        segment={segment}
                      />
                    ))}
                  </div>
                </SortableContext>

                <DragOverlay
                  dropAnimation={{
                    duration: 250,
                    easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)", // Hiệu ứng nảy nhẹ khi thả
                  }}
                >
                  {activeSegment ? (
                    <div className="inline-flex items-center px-4 py-3 bg-white rounded-xl border-2 border-blue-500 shadow-2xl cursor-grabbing w-fit flex-none">
                      <span className="text-lg font-medium text-gray-900 whitespace-nowrap">
                        {activeSegment}
                      </span>
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            </div>

            {/* Preview */}
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Xem trước câu:
              </p>
              <p className="text-xl text-gray-900 leading-relaxed">
                {currentAnswer.join("")}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <ChevronLeft className="w-5 h-5" />
              Câu trước
            </button>
            <button
              onClick={handleNext}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold hover:from-blue-600 hover:to-blue-700 shadow-lg transition-all flex items-center gap-2"
            >
              {isLastQuestion ? "Hoàn thành" : "Câu tiếp theo"}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
