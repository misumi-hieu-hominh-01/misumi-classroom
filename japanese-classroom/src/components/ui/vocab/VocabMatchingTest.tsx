"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { VocabItem } from "@/api/content-api";
import { X, Check } from "lucide-react";
import { VocabTestResult } from "./VocabTestResult";

interface Match {
  vietnameseIndex: number;
  japaneseIndex: number;
}

interface VocabMatchingTestProps {
  words: VocabItem[];
  onClose: () => void;
  onTestComplete?: (score: number, total: number) => void;
  unlockNext?: () => void;
  nextLessonName?: string;
}

interface CardPosition {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function VocabMatchingTest({
  words,
  onClose,
  onTestComplete,
  unlockNext,
  nextLessonName,
}: VocabMatchingTestProps) {
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const [selectedVietnamese, setSelectedVietnamese] = useState<number | null>(
    null
  );
  const [matches, setMatches] = useState<Match[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [cardPositions, setCardPositions] = useState<Map<string, CardPosition>>(
    new Map()
  );

  // Refs to store card elements
  const vietnameseCardRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const japaneseCardRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Shuffle Vietnamese meanings
  const shuffledVietnamese = useMemo(() => {
    const indices = words.map((_, idx) => idx);
    return indices.sort(() => Math.random() - 0.5);
  }, [words]);

  // Shuffle Japanese words
  const shuffledJapanese = useMemo(() => {
    const indices = words.map((_, idx) => idx);
    return indices.sort(() => Math.random() - 0.5);
  }, [words]);

  // Check if test is completed
  const isCompleted = matches.length === words.length;

  // Update card positions when matches change or component mounts
  useEffect(() => {
    function updatePositions() {
      if (!containerRef.current) return;

      const newPositions = new Map<string, CardPosition>();

      // Helper function to get element position relative to the flex container
      // The SVG overlay is inside the flex container, so we use offsetTop/offsetLeft
      // which are relative to the offsetParent (the flex container with position:relative)
      function getRelativePosition(element: HTMLElement) {
        const rect = element.getBoundingClientRect();
        // Use offsetTop/offsetLeft which are relative to offsetParent
        // This works correctly even when scrolling
        const top = element.offsetTop;
        const left = element.offsetLeft;
        const right = element.offsetLeft + element.offsetWidth;
        return {
          top,
          left,
          right,
          width: rect.width,
          height: rect.height,
        };
      }

      // Update Vietnamese card positions (right edge center)
      vietnameseCardRefs.current.forEach((element, index) => {
        if (element) {
          const pos = getRelativePosition(element);
          // Calculate center point vertically: top + height/2
          const centerTop = pos.top + pos.height / 2;
          // Right edge: left + width
          const rightEdge = pos.right;

          newPositions.set(`vietnamese-${index}`, {
            top: centerTop,
            left: rightEdge,
            width: pos.width,
            height: pos.height,
          });
        }
      });

      // Update Japanese card positions (left edge center)
      japaneseCardRefs.current.forEach((element, index) => {
        if (element) {
          const pos = getRelativePosition(element);
          // Calculate center point vertically: top + height/2
          const centerTop = pos.top + pos.height / 2;
          // Left edge
          const leftEdge = pos.left;

          newPositions.set(`japanese-${index}`, {
            top: centerTop,
            left: leftEdge,
            width: pos.width,
            height: pos.height,
          });
        }
      });

      setCardPositions(newPositions);
    }

    // Update positions after DOM is ready using requestAnimationFrame for accuracy
    const updateWithRAF = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(updatePositions);
      });
    };

    const timeoutId = setTimeout(updateWithRAF, 100);

    // Update on scroll with debounce
    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(updatePositions, 10);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll, { passive: true });
    }

    // Also update on window resize
    window.addEventListener("resize", updatePositions);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(scrollTimeout);
      if (container) {
        container.removeEventListener("scroll", handleScroll);
      }
      window.removeEventListener("resize", updatePositions);
    };
  }, [matches, words.length, shuffledVietnamese, shuffledJapanese]);

  // Set ref callback for Vietnamese cards
  function setVietnameseRef(index: number, element: HTMLDivElement | null) {
    if (element) {
      vietnameseCardRefs.current.set(index, element);
    } else {
      vietnameseCardRefs.current.delete(index);
    }
  }

  // Set ref callback for Japanese cards
  function setJapaneseRef(index: number, element: HTMLDivElement | null) {
    if (element) {
      japaneseCardRefs.current.set(index, element);
    } else {
      japaneseCardRefs.current.delete(index);
    }
  }

  function handleFlipCard(index: number) {
    setFlippedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  }

  function handleVietnameseClick(vietnameseIndex: number) {
    // Check if already matched
    const isMatched = matches.some(
      (m) => m.vietnameseIndex === vietnameseIndex
    );
    if (isMatched) return;

    const isFlipped = flippedCards.has(vietnameseIndex);
    const isSelected = selectedVietnamese === vietnameseIndex;

    // If card is already flipped and selected, toggle to close it and deselect
    if (isFlipped && isSelected) {
      handleFlipCard(vietnameseIndex);
      setSelectedVietnamese(null);
    } else if (isFlipped && !isSelected) {
      // If card is flipped but not selected, just select it (don't close)
      setSelectedVietnamese(vietnameseIndex);
    } else {
      // If card is not flipped, flip it and select
      handleFlipCard(vietnameseIndex);
      setSelectedVietnamese(vietnameseIndex);
    }
  }

  function handleJapaneseClick(japaneseIndex: number) {
    if (selectedVietnamese === null) return;

    // Check if already matched
    const isJapaneseMatched = matches.some(
      (m) => m.japaneseIndex === japaneseIndex
    );
    if (isJapaneseMatched) return;

    // Create new match
    const newMatch: Match = {
      vietnameseIndex: selectedVietnamese,
      japaneseIndex,
    };

    setMatches((prev) => [...prev, newMatch]);
    setSelectedVietnamese(null);
  }

  function handleConfirm() {
    setShowResult(true);
  }

  function handleRetry() {
    setFlippedCards(new Set());
    setSelectedVietnamese(null);
    setMatches([]);
    setShowResult(false);
  }

  // Calculate score
  const correctMatches = matches.filter((match) => {
    const vietnameseOriginalIndex = shuffledVietnamese[match.vietnameseIndex];
    const japaneseOriginalIndex = shuffledJapanese[match.japaneseIndex];
    return vietnameseOriginalIndex === japaneseOriginalIndex;
  }).length;

  if (showResult) {
    return (
      <VocabTestResult
        totalWords={words.length}
        correctAnswers={correctMatches}
        matches={matches}
        words={words}
        shuffledVietnamese={shuffledVietnamese}
        shuffledJapanese={shuffledJapanese}
        onRetry={handleRetry}
        onClose={onClose}
        onTestComplete={onTestComplete}
        unlockNext={unlockNext}
        nextLessonName={nextLessonName}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Kiểm tra từ vựng
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Ghép nghĩa tiếng Việt với từ tiếng Nhật tương ứng
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Main Content */}
        <div
          ref={containerRef}
          className="matching-container flex-1 overflow-y-auto p-6 relative"
        >
          <div className="flex gap-10 max-w-5xl mx-auto relative">
            {/* Left Column - Vietnamese Meanings (Flippable Cards) */}
            <div className="flex-1 space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                Nghĩa tiếng Việt
              </h3>
              {shuffledVietnamese.map((originalIndex, displayIndex) => {
                const word = words[originalIndex];
                const isFlipped = flippedCards.has(displayIndex);
                const isSelected = selectedVietnamese === displayIndex;
                const isMatched = matches.some(
                  (m) => m.vietnameseIndex === displayIndex
                );

                return (
                  <div
                    key={displayIndex}
                    ref={(el) => setVietnameseRef(displayIndex, el)}
                    className={`relative h-20 cursor-pointer transition-all duration-300 ${
                      isMatched ? "opacity-50 pointer-events-none" : ""
                    }`}
                    onClick={() => handleVietnameseClick(displayIndex)}
                  >
                    <div
                      className={`absolute inset-0 rounded-xl transition-all duration-500 ${
                        isFlipped ? "[transform:rotateY(180deg)]" : ""
                      }`}
                      style={{ transformStyle: "preserve-3d" }}
                    >
                      {/* Front Face (Hidden) */}
                      <div
                        className={`absolute inset-0 rounded-xl bg-gradient-to-br from-blue-400 to-blue-500 shadow-lg flex items-center justify-center ${
                          isSelected ? "ring-4 ring-yellow-400" : ""
                        }`}
                        style={{ backfaceVisibility: "hidden" }}
                      >
                        <div className="text-white text-4xl font-bold">?</div>
                      </div>

                      {/* Back Face (Meaning) */}
                      <div
                        className={`absolute inset-0 rounded-xl bg-white shadow-lg border-2 flex items-center justify-center p-4 ${
                          isSelected
                            ? "border-yellow-400 ring-4 ring-yellow-400"
                            : "border-blue-300"
                        } ${isMatched ? "bg-gray-50 border-gray-300" : ""}`}
                        style={{
                          backfaceVisibility: "hidden",
                          transform: "rotateY(180deg)",
                        }}
                      >
                        <div className="text-center">
                          <p className="text-lg font-semibold text-gray-900">
                            {word.meaningVi.join(", ")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* SVG Lines for connections */}
            <svg
              className="absolute inset-0 pointer-events-none z-0"
              style={{ width: "100%", height: "100%" }}
            >
              {matches.map((match, idx) => {
                const startPos = cardPositions.get(
                  `vietnamese-${match.vietnameseIndex}`
                );
                const endPos = cardPositions.get(
                  `japanese-${match.japaneseIndex}`
                );

                if (!startPos || !endPos) return null;

                return (
                  <line
                    key={idx}
                    x1={startPos.left}
                    y1={startPos.top}
                    x2={endPos.left}
                    y2={endPos.top}
                    stroke="#6366f1"
                    strokeWidth="3"
                    strokeDasharray="0"
                  />
                );
              })}
            </svg>

            {/* Right Column - Japanese Words */}
            <div className="flex-1 space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                Từ tiếng Nhật
              </h3>
              {shuffledJapanese.map((originalIndex, displayIndex) => {
                const word = words[originalIndex];
                const isMatched = matches.some(
                  (m) => m.japaneseIndex === displayIndex
                );

                return (
                  <div
                    key={displayIndex}
                    ref={(el) => setJapaneseRef(displayIndex, el)}
                    onClick={() => handleJapaneseClick(displayIndex)}
                    className={`h-20 rounded-xl bg-white shadow-lg border-2 flex items-center justify-between p-4 transition-all duration-300 ${
                      isMatched
                        ? "border-gray-300 bg-gray-50 opacity-50 pointer-events-none"
                        : "border-purple-300 hover:border-purple-400 hover:shadow-xl cursor-pointer"
                    }`}
                  >
                    <div className="flex-1">
                      <p className="text-xl font-bold text-gray-900">
                        {word.term}
                      </p>
                      <p className="text-sm text-gray-600">{word.reading}</p>
                    </div>
                    {isMatched && (
                      <Check className="w-6 h-6 text-gray-500 ml-2 flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between gap-4 max-w-5xl mx-auto">
            {/* Progress Bar - Left Side */}
            <div className="flex-1 max-w-xs">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600">
                  Đã ghép: {matches.length}/{words.length}
                </span>
                <span className="font-semibold text-gray-900">
                  {Math.round((matches.length / words.length) * 100)}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                  style={{ width: `${(matches.length / words.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Buttons - Right Side */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirm}
                disabled={!isCompleted}
                className={`px-8 py-3 rounded-xl font-semibold text-white transition-all ${
                  isCompleted
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg"
                    : "bg-gray-300 cursor-not-allowed"
                }`}
              >
                {isCompleted
                  ? "Xem kết quả"
                  : "Hoàn thành tất cả để xem kết quả"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
