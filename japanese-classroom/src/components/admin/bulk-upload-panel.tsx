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
        { name: "compDetail" }, // JSON string: [{"h": "THỦ", "w": "扌"}, {"h": "THỊ", "w": "是"}]
        { name: "tips[]", isArray: true },
        { name: "strokes" },
        { name: "level" },
        { name: "example_kun" }, // JSON string: {"さ.げる": [{"m": "...", "w": "...", "p": "..."}]}
        { name: "example_on" }, // JSON string: {"テイ": [{"m": "...", "w": "...", "p": "..."}]}
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
  ): { rows: ParsedRow[]; headers: string[]; error?: string } => {
    // Chuẩn hoá line breaks
    const normalizedText = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

    // Detect delimiter từ dòng đầu tiên
    const firstNewlineIndex = normalizedText.indexOf("\n");
    const firstLine =
      firstNewlineIndex > 0
        ? normalizedText.substring(0, firstNewlineIndex)
        : normalizedText;

    const delimiter = firstLine.includes("\t") ? "\t" : ",";

    // Luôn sử dụng field config mặc định, không cần header
    const parsedHeaders = getFieldNames();
    const expectedColumnCount = parsedHeaders.length;
    const startLine = 0; // Bắt đầu từ dòng đầu tiên

    if (parsedHeaders.length === 0) return { rows: [], headers: [] };

    // Xác định các cột có thể rỗng
    const optionalColumns: string[] = [];
    if (type === "vocab") {
      const synonymsIndex = parsedHeaders.indexOf("synonyms[]");
      const antonymsIndex = parsedHeaders.indexOf("antonyms[]");
      if (synonymsIndex >= 0) optionalColumns.push("synonyms[]");
      if (antonymsIndex >= 0) optionalColumns.push("antonyms[]");
    } else if (type === "kanji") {
      const compDetailIndex = parsedHeaders.indexOf("compDetail");
      if (compDetailIndex >= 0) optionalColumns.push("compDetail");
    }
    // Số cột tối thiểu = tổng số cột - số cột optional
    const minColumnCount = expectedColumnCount - optionalColumns.length;

    // Hàm validate số cột
    const validateColumnCount = (
      values: string[],
      rowNumber: number
    ): string | null => {
      const actualCount = values.length;
      // Cho phép đủ số cột hoặc thiếu tối đa các cột optional ở cuối
      if (actualCount < minColumnCount) {
        return `Dòng ${rowNumber}: Thiếu cột. Cần ít nhất ${minColumnCount} cột, nhưng chỉ có ${actualCount} cột.`;
      }
      if (actualCount > expectedColumnCount) {
        return `Dòng ${rowNumber}: Thừa cột. Chỉ cần ${expectedColumnCount} cột, nhưng có ${actualCount} cột.`;
      }
      // Nếu thiếu cột nhưng trong phạm vi cho phép (chỉ thiếu optional columns)
      if (actualCount < expectedColumnCount) {
        const missingCount = expectedColumnCount - actualCount;
        if (missingCount > optionalColumns.length) {
          return `Dòng ${rowNumber}: Thiếu ${missingCount} cột. Chỉ cho phép thiếu tối đa ${
            optionalColumns.length
          } cột cuối (${optionalColumns.join(", ")}).`;
        }
      }
      return null;
    };

    // Parse rows: với tab delimiter, mỗi dòng thực sự phải có đúng số tab = expectedColumnCount - 1
    // Nếu một dòng có ít tab hơn, có thể là do line break trong cell, cần gộp với dòng tiếp theo
    const rows: ParsedRow[] = [];
    const seen = new Set<string>(); // set để chống trùng cả dòng
    let rowNumber = 1; // Đếm số dòng để báo lỗi

    if (delimiter === "\t") {
      // Xử lý tab-delimited: gộp các dòng có ít tab hơn expected
      const allLines = normalizedText.split("\n");
      let currentRow = "";

      // Xác định các field bắt buộc để kiểm tra dòng mới
      const requiredFields =
        type === "vocab"
          ? ["term", "reading"]
          : type === "kanji"
          ? ["kanji"]
          : ["title"];
      const firstRequiredFieldIndex = parsedHeaders.findIndex(
        (h) => h === requiredFields[0] || h.startsWith(requiredFields[0])
      );

      for (let i = startLine; i < allLines.length; i++) {
        const line = allLines[i];
        const trimmedLine = line.trim();

        // Bỏ qua dòng trống hoàn toàn
        if (!trimmedLine) {
          // Nếu đang gộp dòng, tiếp tục gộp (có thể là line break trong cell)
          if (currentRow) {
            currentRow += "\n";
          }
          continue;
        }

        // Kiểm tra xem dòng này có phải là dòng mới không (bắt đầu bằng field bắt buộc)
        const lineValues = trimmedLine.split(delimiter).map((v) => v.trim());
        const isNewRow =
          firstRequiredFieldIndex >= 0 &&
          lineValues[firstRequiredFieldIndex] &&
          lineValues[firstRequiredFieldIndex].length > 0;

        // Nếu đây là dòng mới và đang có currentRow, xử lý currentRow trước
        if (isNewRow && currentRow) {
          const values = currentRow.split(delimiter).map((v) => v.trim());

          // Validate số cột
          const columnError = validateColumnCount(values, rowNumber);
          if (columnError) {
            return { rows: [], headers: parsedHeaders, error: columnError };
          }

          // Pad chỉ các cột optional ở cuối nếu thiếu
          while (values.length < parsedHeaders.length) {
            values.push("");
          }

          if (!seen.has(currentRow)) {
            seen.add(currentRow);

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

            if (hasRequiredFields) {
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
          currentRow = "";
          rowNumber++;
        }

        // Thêm dòng hiện tại vào currentRow
        if (currentRow) {
          currentRow += "\n" + trimmedLine;
        } else {
          currentRow = trimmedLine;
        }

        // Đếm số tab trong dòng hiện tại
        const tabCount = (currentRow.match(/\t/g) || []).length;

        // Nếu đủ số tab (hoặc nhiều hơn), đây là một dòng hoàn chỉnh
        // Hoặc nếu dòng tiếp theo là dòng mới, thì dòng hiện tại đã hoàn chỉnh
        const nextLine = i + 1 < allLines.length ? allLines[i + 1].trim() : "";
        const nextLineValues = nextLine
          ? nextLine.split(delimiter).map((v) => v.trim())
          : [];
        const nextIsNewRow =
          nextLine &&
          firstRequiredFieldIndex >= 0 &&
          nextLineValues[firstRequiredFieldIndex] &&
          nextLineValues[firstRequiredFieldIndex].length > 0;

        if (tabCount >= expectedColumnCount - 1 || nextIsNewRow) {
          // Bỏ qua nếu dòng trống hoặc đã thấy
          if (!currentRow || seen.has(currentRow)) {
            currentRow = "";
            continue;
          }

          seen.add(currentRow);

          const values = currentRow.split(delimiter).map((v) => v.trim());

          // Validate số cột
          const columnError = validateColumnCount(values, rowNumber);
          if (columnError) {
            return { rows: [], headers: parsedHeaders, error: columnError };
          }

          // Pad chỉ các cột optional ở cuối nếu thiếu
          while (values.length < parsedHeaders.length) {
            values.push("");
          }

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

          if (hasRequiredFields) {
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
          rowNumber++;
        }
        // Nếu chưa đủ tab và dòng tiếp theo không phải dòng mới, tiếp tục gộp
      }

      // Xử lý dòng cuối cùng nếu còn
      if (currentRow && !seen.has(currentRow)) {
        seen.add(currentRow);

        const values = currentRow.split(delimiter).map((v) => v.trim());

        // Validate số cột
        const columnError = validateColumnCount(values, rowNumber);
        if (columnError) {
          return { rows: [], headers: parsedHeaders, error: columnError };
        }

        // Pad chỉ các cột optional ở cuối nếu thiếu
        while (values.length < parsedHeaders.length) {
          values.push("");
        }

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

        if (hasRequiredFields) {
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

      let commaRowNumber = 1;
      for (let i = startLine; i < rawLines.length; i++) {
        const line = rawLines[i];

        if (seen.has(line)) continue;
        seen.add(line);

        const values = line.split(delimiter).map((v) => v.trim());

        // Validate số cột
        const columnError = validateColumnCount(values, commaRowNumber);
        if (columnError) {
          return { rows: [], headers: parsedHeaders, error: columnError };
        }

        // Pad chỉ các cột optional ở cuối nếu thiếu
        while (values.length < parsedHeaders.length) {
          values.push("");
        }

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
        commaRowNumber++;
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
    | Array<{
        h: string;
        w: string;
      }>
    | undefined => {
    if (value == null) return undefined;

    const rawValue = Array.isArray(value) ? value[0] : value;
    if (!rawValue || typeof rawValue !== "string") return undefined;

    const trimmed = rawValue.trim();
    if (!trimmed) return undefined;

    try {
      const parsed = JSON.parse(trimmed);
      if (!Array.isArray(parsed)) {
        return undefined;
      }

      // Validate structure: should be Array<{h, w}>
      const result = parsed
        .filter(
          (item): item is { h: string; w: string } =>
            typeof item === "object" &&
            item !== null &&
            typeof item.h === "string" &&
            typeof item.w === "string"
        )
        .map((item) => ({
          h: item.h,
          w: item.w,
        }));

      return result.length > 0 ? result : undefined;
    } catch {
      // If JSON parse fails, return undefined
      return undefined;
    }
  };

  const parseExampleKunOn = (
    value: string | string[] | undefined
  ):
    | Record<
        string,
        Array<{
          m: string;
          w: string;
          p: string;
        }>
      >
    | undefined => {
    if (value == null) return undefined;

    const rawValue = Array.isArray(value) ? value[0] : value;
    if (!rawValue || typeof rawValue !== "string") return undefined;

    const trimmed = rawValue.trim();
    if (!trimmed) return undefined;

    try {
      const parsed = JSON.parse(trimmed);
      if (
        typeof parsed !== "object" ||
        parsed === null ||
        Array.isArray(parsed)
      ) {
        return undefined;
      }

      // Validate structure: should be Record<string, Array<{m, w, p}>>
      const result: Record<
        string,
        Array<{
          m: string;
          w: string;
          p: string;
        }>
      > = {};

      for (const [key, value] of Object.entries(parsed)) {
        if (Array.isArray(value)) {
          const items = value
            .filter(
              (item): item is { m: string; w: string; p: string } =>
                typeof item === "object" &&
                item !== null &&
                typeof item.m === "string" &&
                typeof item.w === "string" &&
                typeof item.p === "string"
            )
            .map((item) => ({
              m: item.m,
              w: item.w,
              p: item.p,
            }));

          if (items.length > 0) {
            result[key] = items;
          }
        }
      }

      return Object.keys(result).length > 0 ? result : undefined;
    } catch {
      // If JSON parse fails, return undefined
      return undefined;
    }
  };

  // 4. Handle change events (onChange cũng handle paste event)
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setPastedData(text);
    if (text.trim()) {
      const result = parseExcelData(text);
      setHeaders(result.headers);
      if (result.error) {
        setError(result.error);
        setPreview([]);
      } else {
        setPreview(result.rows.slice(0, 5));
        setError(null);
      }
    } else {
      setPreview([]);
      setHeaders([]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!pastedData.trim()) {
      setError("Vui lòng dán dữ liệu từ Excel");
      return;
    }

    const result = parseExcelData(pastedData);
    if (result.error) {
      setError(result.error);
      return;
    }

    const { rows: parsed } = result;
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
          // compDetail, tips[], strokes, level,
          // example_kun, example_on
          const hanmean = getArrayField(row, ["hanmean[]", "hanmean"]);
          const onyomi = getArrayField(row, ["onyomi[]", "onyomi"]);
          const kunyomi = getArrayField(row, ["kunyomi[]", "kunyomi"]);
          const meaningVi = getArrayField(row, ["meaningVi[]", "meaningVi"]);
          const tips = getArrayField(row, ["tips[]", "tips"]);

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
            level: row.level as string,
            example_kun: parseExampleKunOn(
              row.example_kun as string | string[] | undefined
            ),
            example_on: parseExampleKunOn(
              row.example_on as string | string[] | undefined
            ),
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
          Copy dữ liệu từ Excel và dán vào ô bên dưới (không cần dòng header).
          Các cột theo thứ tự:{" "}
          <code className="bg-gray-100 px-2 py-1 rounded">
            {getFieldNames().join(", ")}
          </code>
        </p>
        <p className="text-xs text-gray-500 mb-4">
          Lưu ý: Các trường có [] là mảng, dùng dấu phẩy để phân cách. Ví dụ:
          meaningVi[] = &quot;nghĩa 1, nghĩa 2&quot;. Examples dùng format:
          &quot;câu ví dụ|reading|nghĩa ví dụ&quot;, nhiều ví dụ phân cách bằng
          dấu phẩy.
        </p>
        {type === "kanji" && (
          <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded mb-4 border border-amber-200">
            <strong>⚠️ Lưu ý đặc biệt:</strong> Trường{" "}
            <strong>compDetail</strong>, <strong>example_kun</strong> và{" "}
            <strong>example_on</strong> phải nhập dưới dạng JSON string. Ví dụ:{" "}
            <code className="bg-amber-100 px-1 rounded">
              {`compDetail: [{"h": "THỦ", "w": "扌"}, {"h": "THỊ", "w": "是"}]`}
            </code>
            <br />
            <code className="bg-amber-100 px-1 rounded">
              {`example_kun: {"さ.げる": [{"m": "Cầm trong tay", "w": "提げる", "p": "さげる"}]}`}
            </code>
          </p>
        )}
      </div>

      <textarea
        value={pastedData}
        onChange={handleChange}
        placeholder="Dán dữ liệu từ Excel vào đây (Ctrl+V)..."
        className="w-full h-48 p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D4C4B0] resize-none text-gray-700"
      />

      {preview.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">
            Preview ({preview.length} dòng đầu tiên, tổng cộng sẽ upload{" "}
            {(() => {
              const result = parseExcelData(pastedData);
              return result.error ? 0 : result.rows.length;
            })()}{" "}
            dòng):
          </p>
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  {headers.map((header) => (
                    <th
                      key={header}
                      className="px-2 py-1 text-left border-b text-gray-700"
                    >
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
                        <td
                          key={header}
                          className="px-2 py-1 border-r text-gray-700"
                        >
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
          disabled={
            isUploading ||
            !pastedData.trim() ||
            (() => {
              const result = parseExcelData(pastedData);
              return !!result.error || result.rows.length === 0;
            })()
          }
          className="px-4 py-2 rounded-lg bg-[#D4C4B0] text-[#5C4A37] font-medium hover:bg-[#C9B8A3] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isUploading
            ? "Đang upload..."
            : (() => {
                const result = parseExcelData(pastedData);
                return result.error
                  ? "Lỗi định dạng"
                  : `Upload ${result.rows.length} dòng`;
              })()}
        </button>
      </div>
    </div>
  );
}
