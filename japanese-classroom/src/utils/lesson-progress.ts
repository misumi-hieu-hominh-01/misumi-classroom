/**
 * Utility functions for managing lesson progress in localStorage
 * Progress is stored per day and reset when a new day is checked in
 * Structure: { "dateKey": { "vocab": {...}, "kanji": {...}, "grammar": {...} } }
 */

export interface LessonProgress {
  completedIndices: number[];
  testPassed: boolean;
  testScore?: number;
  testTotal?: number;
  lastUpdated: string; // ISO date string
}

interface LessonProgressStorage {
  [dateKey: string]: {
    vocab?: LessonProgress;
    kanji?: LessonProgress;
    grammar?: LessonProgress;
  };
}

const STORAGE_KEY = "lesson-progress";
const OLD_STORAGE_PREFIX = "lesson_progress_";

/**
 * Migrate old storage format to new unified format
 * Old: lesson_progress_vocab_2025-01-01, lesson_progress_kanji_2025-01-01, etc.
 * New: lesson-progress with { "2025-01-01": { vocab: {...}, kanji: {...} } }
 */
function migrateOldStorage(): void {
  if (typeof window === "undefined") return;

  try {
    // Check if new format already exists
    const newFormat = localStorage.getItem(STORAGE_KEY);
    if (newFormat) return; // Already migrated

    const migrated: LessonProgressStorage = {};

    // Find all old storage keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(OLD_STORAGE_PREFIX)) continue;

      try {
        // Parse old key format: lesson_progress_vocab_2025-01-01
        const parts = key.substring(OLD_STORAGE_PREFIX.length).split("_");
        if (parts.length < 2) continue;

        const lessonType = parts[0] as "vocab" | "kanji" | "grammar";
        const dateKey = parts.slice(1).join("_"); // Handle dateKey format

        if (!["vocab", "kanji", "grammar"].includes(lessonType)) continue;

        const stored = localStorage.getItem(key);
        if (!stored) continue;

        const progress = JSON.parse(stored) as LessonProgress;

        // Initialize date entry if it doesn't exist
        if (!migrated[dateKey]) {
          migrated[dateKey] = {};
        }

        // Add progress to migrated structure
        migrated[dateKey][lessonType] = progress;
      } catch (error) {
        console.error(`Error migrating key ${key}:`, error);
      }
    }

    // Save migrated data
    if (Object.keys(migrated).length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));

      // Remove old keys after successful migration
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(OLD_STORAGE_PREFIX)) {
          localStorage.removeItem(key);
        }
      }
    }
  } catch (error) {
    console.error("Error migrating old storage:", error);
  }
}

function getAllProgress(): LessonProgressStorage {
  if (typeof window === "undefined") return {};

  try {
    // Migrate old storage format on first load
    migrateOldStorage();

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};
    return JSON.parse(stored) as LessonProgressStorage;
  } catch (error) {
    console.error("Error loading all progress:", error);
    return {};
  }
}

function saveAllProgress(progress: LessonProgressStorage): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error("Error saving all progress:", error);
  }
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
    const allProgress = getAllProgress();
    const dateProgress = allProgress[dateKey];
    if (!dateProgress) return null;

    return dateProgress[lessonType] || null;
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
    const allProgress = getAllProgress();
    const existing = loadProgress(lessonType, dateKey);
    const updated: LessonProgress = {
      completedIndices:
        progress.completedIndices ?? existing?.completedIndices ?? [],
      testPassed: progress.testPassed ?? existing?.testPassed ?? false,
      testScore: progress.testScore ?? existing?.testScore,
      testTotal: progress.testTotal ?? existing?.testTotal,
      lastUpdated: new Date().toISOString(),
    };

    // Initialize date entry if it doesn't exist
    if (!allProgress[dateKey]) {
      allProgress[dateKey] = {};
    }

    // Update the specific lesson type
    allProgress[dateKey][lessonType] = updated;

    saveAllProgress(allProgress);
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
    const allProgress = getAllProgress();
    if (allProgress[dateKey]) {
      delete allProgress[dateKey][lessonType];

      // If no lessons left for this date, remove the date entry
      if (
        Object.keys(allProgress[dateKey]).length === 0
      ) {
        delete allProgress[dateKey];
      }

      saveAllProgress(allProgress);
    }
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
    const allProgress = getAllProgress();
    const dateKeys = Object.keys(allProgress);
    let hasChanges = false;

    dateKeys.forEach((dateKey) => {
      if (dateKey < currentDateKey) {
        delete allProgress[dateKey];
        hasChanges = true;
      }
    });

    if (hasChanges) {
      saveAllProgress(allProgress);
    }
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
