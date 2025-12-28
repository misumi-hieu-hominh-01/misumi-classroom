"use client";

import { Check } from "lucide-react";
import { ReactNode } from "react";

interface LessonItemListProps<T extends { _id: string }> {
  items: T[];
  currentIndex: number;
  completedIndices: Set<number>;
  onItemSelect: (index: number) => void;
  renderContent: (item: T, index: number) => ReactNode;
  spacing?: "sm" | "md";
  padding?: "sm" | "md";
  badgePadding?: "sm" | "md";
}

export function LessonItemList<T extends { _id: string }>({
  items,
  currentIndex,
  completedIndices,
  onItemSelect,
  renderContent,
  spacing = "md",
  padding = "md",
  badgePadding = "md",
}: LessonItemListProps<T>) {
  const spacingClass = spacing === "sm" ? "space-y-1.5" : "space-y-2";
  const paddingClass = padding === "sm" ? "p-3" : "p-4";
  const badgePaddingClass = badgePadding === "sm" ? "px-2 py-0.5" : "px-3 py-1";

  return (
    <div className={spacingClass}>
      {items.map((item, index) => {
        const isActive = index === currentIndex;
        const isCompleted = completedIndices.has(index);

        return (
          <button
            key={item._id}
            onClick={() => onItemSelect(index)}
            className={`w-full ${paddingClass} rounded-lg text-left transition-all ${
              isActive
                ? "bg-blue-100 border-2 border-blue-500"
                : isCompleted
                ? "bg-white border-2 border-gray-200 hover:border-blue-300"
                : "bg-white border-2 border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">{renderContent(item, index)}</div>
              <div>
                {isCompleted ? (
                  <span
                    className={`inline-flex items-center ${badgePaddingClass} rounded-full text-xs font-medium bg-green-100 text-green-700`}
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Hoàn thành
                  </span>
                ) : isActive ? (
                  <span
                    className={`inline-flex items-center ${badgePaddingClass} rounded-full text-xs font-medium bg-blue-100 text-blue-700`}
                  >
                    Hoạt động
                  </span>
                ) : null}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
