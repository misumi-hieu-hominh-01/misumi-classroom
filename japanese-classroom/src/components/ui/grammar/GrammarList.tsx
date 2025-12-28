"use client";

import { GrammarPoint } from "@/api/content-api";
import { LessonItemList } from "../shared/LessonItemList";
import { parseHtmlWithRuby } from "@/utils/html-parser";

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
      renderContent={(grammarPoint, index) => (
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-gray-500">
            {index + 1}.
          </span>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 truncate">
              {grammarPoint.title}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {parseHtmlWithRuby(grammarPoint.pattern)}
            </div>
          </div>
        </div>
      )}
    />
  );
}
