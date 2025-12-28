"use client";

import { VocabItem } from "@/api/content-api";
import { LessonItemList } from "../shared/LessonItemList";

interface WordListProps {
  words: VocabItem[];
  currentIndex: number;
  completedIndices: Set<number>;
  onWordSelect: (index: number) => void;
}

export function WordList({
  words,
  currentIndex,
  completedIndices,
  onWordSelect,
}: WordListProps) {
  return (
    <LessonItemList
      items={words}
      currentIndex={currentIndex}
      completedIndices={completedIndices}
      onItemSelect={onWordSelect}
      spacing="sm"
      padding="sm"
      badgePadding="sm"
      renderContent={(word, index) => (
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500">
            {index + 1}.
          </span>
          <div>
            <div className="text-sm font-medium text-gray-900">{word.term}</div>
            <div className="text-xs text-gray-600">{word.reading}</div>
          </div>
        </div>
      )}
    />
  );
}
