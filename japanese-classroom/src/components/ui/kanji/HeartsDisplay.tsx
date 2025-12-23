"use client";

import { Heart } from "lucide-react";

interface HeartsDisplayProps {
  hearts: number;
  totalHearts?: number;
  removingHeartIndex?: number | null;
}

export function HeartsDisplay({
  hearts,
  totalHearts = 3,
  removingHeartIndex = null,
}: HeartsDisplayProps) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: totalHearts }).map((_, index) => {
        // Calculate if this heart should be colored
        // Hearts are removed from left to right
        // When hearts = 3, all have color (index 0, 1, 2)
        // When hearts = 2, index 0 is removed, index 1, 2 have color
        // When hearts = 1, index 0, 1 are removed, index 2 has color
        // When hearts = 0, all are removed
        // So: index >= (totalHearts - hearts) means this heart should have color
        const shouldHaveColor = index >= totalHearts - hearts;

        return (
          <Heart
            key={index}
            className={`w-5 h-5 transition-all duration-300 ${
              shouldHaveColor
                ? "text-red-500 fill-red-500"
                : "text-gray-300 fill-gray-300"
            } ${
              removingHeartIndex === index
                ? "opacity-0 scale-0"
                : "opacity-100 scale-100"
            }`}
          />
        );
      })}
    </div>
  );
}
