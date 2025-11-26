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

export function BulkUploadPanel({
  type,
  onUpload,
  onCancel,
}: BulkUploadPanelProps) {
  const [pastedData, setPastedData] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ParsedRow[]>([]);

  const parseExcelData = (text: string): ParsedRow[] => {
    const lines = text
      .trim()
      .split("\n")
      .filter((line) => line.trim().length > 0);

    if (lines.length === 0) return [];

    // Detect delimiter (tab or comma)
    const firstLine = lines[0];
    const delimiter = firstLine.includes("\t") ? "\t" : ",";

    // Parse header
    const headers = firstLine.split(delimiter).map((h) => h.trim());

    // Parse rows
    const rows: ParsedRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(delimiter).map((v) => v.trim());
      if (values.length === 0 || values.every((v) => !v)) continue;

      const row: ParsedRow = {};
      headers.forEach((header, index) => {
        const value = values[index] || "";
        // Handle array fields (comma-separated)
        if (
          header.includes("[]") ||
          header.includes("Vi") ||
          header.includes("mean")
        ) {
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

    return rows;
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const text = e.clipboardData.getData("text");
    setPastedData(text);
    const parsed = parseExcelData(text);
    setPreview(parsed.slice(0, 5)); // Show first 5 rows as preview
    setError(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setPastedData(text);
    if (text.trim()) {
      const parsed = parseExcelData(text);
      setPreview(parsed.slice(0, 5));
      setError(null);
    } else {
      setPreview([]);
    }
  };

  const handleUpload = async () => {
    if (!pastedData.trim()) {
      setError("Vui lòng dán dữ liệu từ Excel");
      return;
    }

    const parsed = parseExcelData(pastedData);
    if (parsed.length === 0) {
      setError("Không tìm thấy dữ liệu hợp lệ");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Transform parsed data to match API format
      const transformed = parsed.map((row) => {
        if (type === "vocab") {
          return {
            term: row.term as string,
            reading: row.reading as string,
            meaningVi: Array.isArray(row.meaningVi)
              ? row.meaningVi
              : [row.meaningVi as string],
            level: row.level as string,
            imageUrl: row.imageUrl as string | undefined,
            type: row.type as string | undefined,
            examples: row.examples
              ? (Array.isArray(row.examples)
                  ? row.examples
                  : [row.examples]
                ).map((ex) => {
                  const parts = (ex as string).split("|");
                  return {
                    sentence: parts[0] || "",
                    meaning: parts[1] || "",
                  };
                })
              : undefined,
          };
        } else if (type === "kanji") {
          return {
            kanji: row.kanji as string,
            hanmean: row.hanmean
              ? Array.isArray(row.hanmean)
                ? row.hanmean
                : [row.hanmean as string]
              : undefined,
            onyomi: row.onyomi
              ? Array.isArray(row.onyomi)
                ? row.onyomi
                : [row.onyomi as string]
              : undefined,
            kunyomi: row.kunyomi
              ? Array.isArray(row.kunyomi)
                ? row.kunyomi
                : [row.kunyomi as string]
              : undefined,
            meaningVi: Array.isArray(row.meaningVi)
              ? row.meaningVi
              : [row.meaningVi as string],
            compDetail: row.compDetail
              ? (Array.isArray(row.compDetail)
                  ? row.compDetail
                  : [row.compDetail]
                ).map((cd) => {
                  const parts = (cd as string).split("|");
                  return {
                    component: parts[0] || "",
                    meaning: parts[1] || "",
                  };
                })
              : undefined,
            tips: row.tips
              ? Array.isArray(row.tips)
                ? row.tips
                : [row.tips as string]
              : undefined,
            strokes: row.strokes
              ? parseInt(row.strokes as string, 10)
              : undefined,
            imageUrl: row.imageUrl as string | undefined,
            level: row.level as string,
            examples: row.examples
              ? (Array.isArray(row.examples)
                  ? row.examples
                  : [row.examples]
                ).map((ex) => {
                  const parts = (ex as string).split("|");
                  return {
                    sentence: parts[0] || "",
                    meaning: parts[1] || "",
                  };
                })
              : undefined,
          };
        } else {
          // grammar
          return {
            title: row.title as string,
            pattern: row.pattern as string,
            explainVi: row.explainVi as string,
            level: row.level as string,
            examples: row.examples
              ? (Array.isArray(row.examples)
                  ? row.examples
                  : [row.examples]
                ).map((ex) => {
                  const parts = (ex as string).split("|");
                  return {
                    sentence: parts[0] || "",
                    meaning: parts[1] || "",
                  };
                })
              : undefined,
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

  const getFieldNames = () => {
    if (type === "vocab") {
      return [
        "term",
        "reading",
        "meaningVi[]",
        "level",
        "imageUrl",
        "type",
        "examples",
      ];
    } else if (type === "kanji") {
      return [
        "kanji",
        "hanmean[]",
        "onyomi[]",
        "kunyomi[]",
        "meaningVi[]",
        "compDetail",
        "tips[]",
        "strokes",
        "imageUrl",
        "level",
        "examples",
      ];
    } else {
      return ["title", "pattern", "explainVi", "level", "examples"];
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
          &quot;câu ví dụ|nghĩa ví dụ&quot; (phân cách bằng |)
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
            {parseExcelData(pastedData).length} dòng):
          </p>
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  {Object.keys(preview[0] || {}).map((key) => (
                    <th key={key} className="px-2 py-1 text-left border-b">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, idx) => (
                  <tr key={idx} className="border-b">
                    {Object.values(row).map((value, valIdx) => (
                      <td key={valIdx} className="px-2 py-1 border-r">
                        {Array.isArray(value)
                          ? value.join(", ")
                          : String(value)}
                      </td>
                    ))}
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
            : `Upload ${parseExcelData(pastedData).length} dòng`}
        </button>
      </div>
    </div>
  );
}




