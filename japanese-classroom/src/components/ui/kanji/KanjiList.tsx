"use client";

import { KanjiItem } from "@/api/content-api";
import { LessonItemList } from "../shared/LessonItemList";

interface KanjiListProps {
  kanjis: KanjiItem[];
  currentIndex: number;
  completedIndices: Set<number>;
  onKanjiSelect: (index: number) => void;
}

export function KanjiList({
  kanjis,
  currentIndex,
  completedIndices,
  onKanjiSelect,
}: KanjiListProps) {
  return (
    <LessonItemList
      items={kanjis}
      currentIndex={currentIndex}
      completedIndices={completedIndices}
      onItemSelect={onKanjiSelect}
      renderContent={(kanjiItem, index) => (
        <div className="flex items-center gap-3 mb-1">
          <span className="text-sm font-medium text-gray-500">
            {index + 1}.
          </span>
          <div>
            <div className="text-3xl font-medium text-gray-900">
              {kanjiItem.kanji}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {kanjiItem.meaningVi.slice(0, 2).join(", ")}
              {kanjiItem.meaningVi.length > 2 && "..."}
            </div>
          </div>
        </div>
      )}
    />
  );
}
