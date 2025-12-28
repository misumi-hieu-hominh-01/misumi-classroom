"use client";

import { GrammarPoint } from "@/api/content-api";
import { LessonItemList } from "../shared/LessonItemList";
import { parseGrammarTitle } from "@/utils/grammar-parser";

interface GrammarListProps {
  grammarPoints: GrammarPoint[];
  currentIndex: number;
  completedIndices: Set<number>;
  onGrammarSelect: (index: number) => void;
}

export function GrammarList({
  grammarPoints,
  currentIndex,
  completedIndices,
  onGrammarSelect,
}: GrammarListProps) {
  return (
    <LessonItemList
      items={grammarPoints}
      currentIndex={currentIndex}
      completedIndices={completedIndices}
      onItemSelect={onGrammarSelect}
      renderContent={(grammarPoint, index) => {
        const { pattern: titlePattern, meaning: titleMeaning } =
          parseGrammarTitle(grammarPoint.title);

        return (
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-500">
              {index + 1}.
            </span>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 truncate">
                {titlePattern}
              </div>
              {titleMeaning && (
                <div className="text-xs text-gray-500 mt-0.5 truncate">
                  {titleMeaning}
                </div>
              )}
            </div>
          </div>
        );
      }}
    />
  );
}
