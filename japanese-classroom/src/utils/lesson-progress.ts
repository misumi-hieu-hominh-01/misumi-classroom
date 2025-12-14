/**
 * Utility functions for managing lesson progress in localStorage
 * Progress is stored per day and reset when a new day is checked in
 */

export interface LessonProgress {
  completedIndices: number[];
  testPassed: boolean;
  testScore?: number;
  testTotal?: number;
  lastUpdated: string; // ISO date string
}

const STORAGE_PREFIX = "lesson_progress_";

function getStorageKey(
  lessonType: "vocab" | "kanji" | "grammar",
  dateKey: string
): string {
  return `${STORAGE_PREFIX}${lessonType}_${dateKey}`;
}

/**
 * Get today's date key in format YYYY-MM-DD
 */
export function getTodayDateKey(): string {
  const now = new Date();
  const jstOffset = 9 * 60; // JST is UTC+9
  const jstTime = new Date(now.getTime() + jstOffset * 60 * 1000);
  return jstTime.toISOString().split("T")[0];
}

/**
 * Load progress from localStorage for a specific lesson and date
 */
export function loadProgress(
  lessonType: "vocab" | "kanji" | "grammar",
  dateKey: string
): LessonProgress | null {
  if (typeof window === "undefined") return null;

  try {
    const key = getStorageKey(lessonType, dateKey);
    const stored = localStorage.getItem(key);
    if (!stored) return null;

    const progress = JSON.parse(stored) as LessonProgress;
    return progress;
  } catch (error) {
    console.error(`Error loading progress for ${lessonType}:`, error);
    return null;
  }
}

/**
 * Save progress to localStorage for a specific lesson and date
 */
export function saveProgress(
  lessonType: "vocab" | "kanji" | "grammar",
  dateKey: string,
  progress: Partial<LessonProgress>
): void {
  if (typeof window === "undefined") return;

  try {
    const key = getStorageKey(lessonType, dateKey);
    const existing = loadProgress(lessonType, dateKey);
    const updated: LessonProgress = {
      completedIndices:
        progress.completedIndices ?? existing?.completedIndices ?? [],
      testPassed: progress.testPassed ?? existing?.testPassed ?? false,
      testScore: progress.testScore ?? existing?.testScore,
      testTotal: progress.testTotal ?? existing?.testTotal,
      lastUpdated: new Date().toISOString(),
    };

    localStorage.setItem(key, JSON.stringify(updated));
  } catch (error) {
    console.error(`Error saving progress for ${lessonType}:`, error);
  }
}

/**
 * Clear progress for a specific lesson and date
 */
export function clearProgress(
  lessonType: "vocab" | "kanji" | "grammar",
  dateKey: string
): void {
  if (typeof window === "undefined") return;

  try {
    const key = getStorageKey(lessonType, dateKey);
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error clearing progress for ${lessonType}:`, error);
  }
}

/**
 * Clear all progress for old dates (cleanup)
 */
export function clearOldProgress(currentDateKey: string): void {
  if (typeof window === "undefined") return;

  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        // Extract dateKey from storage key
        const parts = key.split("_");
        if (parts.length >= 3) {
          const dateKey = parts.slice(2).join("_"); // Handle dateKey format
          if (dateKey < currentDateKey) {
            keysToRemove.push(key);
          }
        }
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    console.error("Error clearing old progress:", error);
  }
}

/**
 * Check if progress should be reset based on checkedInAt date
 */
export function shouldResetProgress(
  checkedInAt: string | Date | undefined,
  storedDateKey: string | null
): boolean {
  if (!checkedInAt) return true;

  const checkedInDate = new Date(checkedInAt);
  const todayDateKey = getTodayDateKey();
  const checkedInDateKey = checkedInDate.toISOString().split("T")[0];

  // Reset if checkedInAt is for today but stored progress is for a different day
  return checkedInDateKey === todayDateKey && storedDateKey !== todayDateKey;
}
