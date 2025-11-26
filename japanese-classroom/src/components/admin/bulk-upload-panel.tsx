"use client";

import { useState } from "react";

interface BulkUploadPanelProps {
  type: "vocab" | "kanji" | "grammar";
  onUpload: (data: unknown[]) => Promise<void>;
  onCancel: () => void;
}

interface ParsedRow {
  [key: string]: string | string[];
}

interface FieldConfig {
  name: string;
  isArray?: boolean;
}

export function BulkUploadPanel({
  type,
  onUpload,
  onCancel,
}: BulkUploadPanelProps) {
  const [pastedData, setPastedData] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ParsedRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);

  // 1. Field config for the type
  const getFieldConfig = (t: BulkUploadPanelProps["type"]): FieldConfig[] => {
    if (t === "vocab") {
      return [
        { name: "term" },
        { name: "reading" },
        { name: "meaningVi[]", isArray: true },
        { name: "level" },
        { name: "imageUrl" },
        { name: "type" },
        { name: "examples" },
        { name: "synonyms[]", isArray: true },
        { name: "antonyms[]", isArray: true },
      ];
    } else if (t === "kanji") {
      return [
        { name: "kanji" },
        { name: "hanmean[]", isArray: true },
        { name: "onyomi[]", isArray: true },
        { name: "kunyomi[]", isArray: true },
        { name: "meaningVi[]", isArray: true },
        { name: "compDetail" }, // "component|meaning, component|meaning..."
        { name: "tips[]", isArray: true },
        { name: "strokes" },
        { name: "imageUrl" },
        { name: "level" },
        { name: "examples" },
        { name: "similar[]", isArray: true },
      ];
    } else {
      // grammar
      return [
        { name: "title" },
        { name: "pattern" },
        { name: "explainVi" },
        { name: "level" },
        { name: "examples" },
      ];
    }
  };

  const getFieldNames = () => getFieldConfig(type).map((f) => f.name);

  const arrayHeaderSet = new Set(
    getFieldConfig(type)
      .filter((f) => f.isArray)
      .map((f) => f.name)
  );

  // 2. Parse Excel data
  const parseExcelData = (
    text: string
  ): { rows: ParsedRow[]; headers: string[] } => {
    // Chuẩn hoá line breaks
    const normalizedText = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

    // Detect delimiter từ dòng đầu tiên
    const firstNewlineIndex = normalizedText.indexOf("\n");
    const firstLine =
      firstNewlineIndex > 0
        ? normalizedText.substring(0, firstNewlineIndex)
        : normalizedText;

    const delimiter = firstLine.includes("\t") ? "\t" : ",";
    const expectedColumnCount = firstLine.split(delimiter).length;

    // Parse header
    const parsedHeaders = firstLine.split(delimiter).map((h) => h.trim());

    if (parsedHeaders.length === 0) return { rows: [], headers: [] };

    // Parse rows: với tab delimiter, mỗi dòng thực sự phải có đúng số tab = expectedColumnCount - 1
    // Nếu một dòng có ít tab hơn, có thể là do line break trong cell, cần gộp với dòng tiếp theo
    const rows: ParsedRow[] = [];
    const seen = new Set<string>(); // set để chống trùng cả dòng

    if (delimiter === "\t") {
      // Xử lý tab-delimited: gộp các dòng có ít tab hơn expected
      const allLines = normalizedText.split("\n").map((l) => l.trim());
      let currentRow = "";

      for (let i = 1; i < allLines.length; i++) {
        const line = allLines[i];

        // Bỏ qua dòng trống hoàn toàn
        if (!line) {
          // Nếu đang gộp dòng, tiếp tục gộp (có thể là line break trong cell)
          if (currentRow) {
            currentRow += "\n" + line;
          }
          continue;
        }

        if (currentRow) {
          // Đang gộp dòng từ lần trước
          currentRow += "\n" + line;
        } else {
          currentRow = line;
        }

        // Đếm số tab trong dòng hiện tại
        const tabCount = (currentRow.match(/\t/g) || []).length;

        // Nếu đủ số tab (hoặc nhiều hơn), đây là một dòng hoàn chỉnh
        if (tabCount >= expectedColumnCount - 1) {
          const trimmedRow = currentRow.trim();

          // Bỏ qua nếu dòng trống hoặc đã thấy
          if (!trimmedRow || seen.has(trimmedRow)) {
            currentRow = "";
            continue;
          }

          seen.add(trimmedRow);

          const values = currentRow
            .split(delimiter)
            .map((v) => v.trim())
            .slice(0, parsedHeaders.length); // Chỉ lấy đúng số cột

          // Kiểm tra xem có ít nhất một giá trị không rỗng ở các cột bắt buộc (term/kanji/title)
          // Cho phép các cột optional (như imageUrl, type, antonyms) rỗng
          const requiredFields =
            type === "vocab"
              ? ["term", "reading"]
              : type === "kanji"
              ? ["kanji"]
              : ["title"];

          const hasRequiredFields = requiredFields.some((field) => {
            const fieldIndex = parsedHeaders.findIndex(
              (h) => h === field || h.startsWith(field)
            );
            return (
              fieldIndex >= 0 &&
              values[fieldIndex] &&
              values[fieldIndex].length > 0
            );
          });

          if (hasRequiredFields && values.length >= expectedColumnCount - 1) {
            const row: ParsedRow = {};
            parsedHeaders.forEach((header, index) => {
              const value = values[index] || "";
              if (arrayHeaderSet.has(header)) {
                row[header] = value
                  ? value
                      .split(",")
                      .map((v) => v.trim())
                      .filter(Boolean)
                  : [];
              } else {
                row[header] = value;
              }
            });
            rows.push(row);
          }
          currentRow = "";
        }
        // Nếu chưa đủ tab, tiếp tục gộp với dòng tiếp theo
      }

      // Xử lý dòng cuối cùng nếu còn
      if (currentRow.trim() && !seen.has(currentRow.trim())) {
        const trimmedRow = currentRow.trim();
        seen.add(trimmedRow);

        const values = currentRow
          .split(delimiter)
          .map((v) => v.trim())
          .slice(0, parsedHeaders.length);

        const requiredFields =
          type === "vocab"
            ? ["term", "reading"]
            : type === "kanji"
            ? ["kanji"]
            : ["title"];

        const hasRequiredFields = requiredFields.some((field) => {
          const fieldIndex = parsedHeaders.findIndex(
            (h) => h === field || h.startsWith(field)
          );
          return (
            fieldIndex >= 0 &&
            values[fieldIndex] &&
            values[fieldIndex].length > 0
          );
        });

        if (hasRequiredFields && values.length >= expectedColumnCount - 1) {
          const row: ParsedRow = {};
          parsedHeaders.forEach((header, index) => {
            const value = values[index] || "";
            if (arrayHeaderSet.has(header)) {
              row[header] = value
                ? value
                    .split(",")
                    .map((v) => v.trim())
                    .filter(Boolean)
                : [];
            } else {
              row[header] = value;
            }
          });
          rows.push(row);
        }
      }
    } else {
      // Xử lý comma-delimited: đơn giản hơn, split theo \n
      const rawLines = normalizedText
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      for (let i = 1; i < rawLines.length; i++) {
        const line = rawLines[i];

        if (seen.has(line)) continue;
        seen.add(line);

        const values = line
          .split(delimiter)
          .map((v) => v.trim())
          .filter((v, idx) => idx < parsedHeaders.length);

        if (values.length === 0 || values.every((v) => !v)) continue;

        const row: ParsedRow = {};
        parsedHeaders.forEach((header, index) => {
          const value = values[index] || "";
          if (arrayHeaderSet.has(header)) {
            row[header] = value
              ? value
                  .split(",")
                  .map((v) => v.trim())
                  .filter(Boolean)
              : [];
          } else {
            row[header] = value;
          }
        });

        rows.push(row);
      }
    }

    return { rows, headers: parsedHeaders };
  };

  // 3. Helpers normalize data
  const getArrayField = (
    row: ParsedRow,
    keys: string[]
  ): string[] | undefined => {
    for (const key of keys) {
      const raw = row[key];
      if (raw == null) continue;
      if (Array.isArray(raw)) {
        const arr = raw.filter((v) => !!v);
        return arr.length ? arr : undefined;
      }
      if (typeof raw === "string") {
        const arr = raw
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean);
        return arr.length ? arr : undefined;
      }
    }
    return undefined;
  };

  const parseExamples = (
    value: string | string[] | undefined
  ):
    | {
        sentence: string;
        reading: string;
        meaning: string;
      }[]
    | undefined => {
    if (value == null) return undefined;

    const rawList = Array.isArray(value)
      ? value
      : value.split(",").map((v) => v.trim());

    const cleaned = rawList.filter(Boolean);
    if (!cleaned.length) return undefined;

    return cleaned.map((ex) => {
      const parts = ex.split("|").map((p) => p.trim());
      return {
        sentence: parts[0] || "",
        reading: parts[1] || "",
        meaning: parts[2] || "",
      };
    });
  };

  const parseCompDetail = (
    value: string | string[] | undefined
  ):
    | {
        component: string;
        meaning: string;
      }[]
    | undefined => {
    if (value == null) return undefined;

    const rawList = Array.isArray(value)
      ? value
      : value.split(",").map((v) => v.trim());

    const cleaned = rawList.filter(Boolean);
    if (!cleaned.length) return undefined;

    return cleaned.map((cd) => {
      const parts = cd.split("|").map((p) => p.trim());
      return {
        component: parts[0] || "",
        meaning: parts[1] || "",
      };
    });
  };

  // 4. Handle paste and change events
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const text = e.clipboardData.getData("text");
    setPastedData(text);
    const { rows, headers: parsedHeaders } = parseExcelData(text);
    setHeaders(parsedHeaders);
    setPreview(rows.slice(0, 5)); // Show first 5 rows as preview
    setError(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setPastedData(text);
    if (text.trim()) {
      const { rows, headers: parsedHeaders } = parseExcelData(text);
      setHeaders(parsedHeaders);
      setPreview(rows.slice(0, 5));
      setError(null);
    } else {
      setPreview([]);
      setHeaders([]);
    }
  };

  const handleUpload = async () => {
    if (!pastedData.trim()) {
      setError("Vui lòng dán dữ liệu từ Excel");
      return;
    }

    const { rows: parsed } = parseExcelData(pastedData);
    if (parsed.length === 0) {
      setError("Không tìm thấy dữ liệu hợp lệ");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const transformed = parsed.map((row) => {
        if (type === "vocab") {
          // Vocab schema:
          // term, reading, meaningVi[], level, imageUrl, type, examples, synonyms[], antonyms[]
          const meaningVi = getArrayField(row, ["meaningVi[]", "meaningVi"]);
          const synonyms = getArrayField(row, ["synonyms[]", "synonyms"]);
          const antonyms = getArrayField(row, ["antonyms[]", "antonyms"]);

          return {
            term: row.term as string,
            reading: row.reading as string,
            meaningVi: meaningVi ?? [],
            level: row.level as string,
            imageUrl: (row.imageUrl as string) || undefined,
            type: (row.type as string) || undefined,
            examples: parseExamples(
              row.examples as string | string[] | undefined
            ),
            synonyms,
            antonyms,
          };
        } else if (type === "kanji") {
          // Kanji schema:
          // kanji, hanmean[], onyomi[], kunyomi[], meaningVi[],
          // compDetail, tips[], strokes, imageUrl, level, examples, similar[]
          const hanmean = getArrayField(row, ["hanmean[]", "hanmean"]);
          const onyomi = getArrayField(row, ["onyomi[]", "onyomi"]);
          const kunyomi = getArrayField(row, ["kunyomi[]", "kunyomi"]);
          const meaningVi = getArrayField(row, ["meaningVi[]", "meaningVi"]);
          const tips = getArrayField(row, ["tips[]", "tips"]);
          const similar = getArrayField(row, ["similar[]", "similar"]);

          const strokesRaw = row.strokes as string | undefined;
          const strokes = strokesRaw ? parseInt(strokesRaw, 10) : undefined;

          return {
            kanji: row.kanji as string,
            hanmean,
            onyomi,
            kunyomi,
            meaningVi: meaningVi ?? [],
            compDetail: parseCompDetail(
              row.compDetail as string | string[] | undefined
            ),
            tips,
            strokes: Number.isNaN(strokes) ? undefined : strokes,
            imageUrl: (row.imageUrl as string) || undefined,
            level: row.level as string,
            examples: parseExamples(
              row.examples as string | string[] | undefined
            ),
            similar,
          };
        } else {
          // Grammar schema:
          // title, pattern, explainVi, level, examples
          return {
            title: row.title as string,
            pattern: row.pattern as string,
            explainVi: row.explainVi as string,
            level: row.level as string,
            examples: parseExamples(
              row.examples as string | string[] | undefined
            ),
          };
        }
      });

      await onUpload(transformed);
      setPastedData("");
      setPreview([]);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Có lỗi xảy ra khi upload";
      setError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-[#5C4A37] mb-2">
          Upload hàng loạt -{" "}
          {type === "vocab"
            ? "Từ vựng"
            : type === "kanji"
            ? "Kanji"
            : "Ngữ pháp"}
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Copy dữ liệu từ Excel và dán vào ô bên dưới. Các cột cần có:{" "}
          <code className="bg-gray-100 px-2 py-1 rounded">
            {getFieldNames().join(", ")}
          </code>
        </p>
        <p className="text-xs text-gray-500 mb-4">
          Lưu ý: Các trường có [] là mảng, dùng dấu phẩy để phân cách. Ví dụ:
          meaningVi[] = &quot;nghĩa 1, nghĩa 2&quot;. Examples dùng format:
          &quot;câu ví dụ|reading|nghĩa ví dụ&quot;, nhiều ví dụ phân cách bằng
          dấu phẩy. Kanji compDetail dùng format: &quot;bộ phận|nghĩa, bộ
          phận|nghĩa&quot;.
        </p>
      </div>

      <textarea
        value={pastedData}
        onChange={handleChange}
        onPaste={handlePaste}
        placeholder="Dán dữ liệu từ Excel vào đây (Ctrl+V)..."
        className="w-full h-48 p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D4C4B0] resize-none text-gray-700"
      />

      {preview.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">
            Preview ({preview.length} dòng đầu tiên, tổng cộng sẽ upload{" "}
            {parseExcelData(pastedData).rows.length} dòng):
          </p>
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  {headers.map((header) => (
                    <th key={header} className="px-2 py-1 text-left border-b">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, idx) => (
                  <tr key={idx} className="border-b">
                    {headers.map((header) => {
                      const value = row[header];
                      return (
                        <td key={header} className="px-2 py-1 border-r">
                          {Array.isArray(value)
                            ? value.join(", ")
                            : String(value || "")}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="mt-6 flex gap-3 justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={isUploading}
          className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Hủy
        </button>
        <button
          type="button"
          onClick={handleUpload}
          disabled={isUploading || !pastedData.trim()}
          className="px-4 py-2 rounded-lg bg-[#D4C4B0] text-[#5C4A37] font-medium hover:bg-[#C9B8A3] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isUploading
            ? "Đang upload..."
            : `Upload ${parseExcelData(pastedData).rows.length} dòng`}
        </button>
      </div>
    </div>
  );
}
