/**
 * Parse grammar title with format "pattern => meaning"
 * Example: "～や・～や否や => Ngay khi vừa/Vừa mới"
 *
 * @param title - Grammar title string
 * @returns Object with pattern and meaning, or original title if no separator found
 */
export function parseGrammarTitle(title: string): {
  pattern: string;
  meaning: string;
  hasSeparator: boolean;
} {
  const separator = " => ";
  const separatorIndex = title.indexOf(separator);

  if (separatorIndex === -1) {
    // No separator found, return original title as pattern
    return {
      pattern: title,
      meaning: "",
      hasSeparator: false,
    };
  }

  const pattern = title.substring(0, separatorIndex).trim();
  const meaning = title.substring(separatorIndex + separator.length).trim();

  return {
    pattern,
    meaning,
    hasSeparator: true,
  };
}
