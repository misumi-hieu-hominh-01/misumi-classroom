"use client";

import { useState, useMemo } from "react";
import { ContentTable } from "./content-table";
import { BulkUploadPanel } from "./bulk-upload-panel";
import {
  useContent,
  useDeleteContent,
  useBulkCreateContent,
} from "../../hooks/use-content";
import type { VocabItem, KanjiItem, GrammarPoint } from "../../api/content-api";

type ContentType = "vocab" | "kanji" | "grammar";
type ContentItem = VocabItem | KanjiItem | GrammarPoint;

interface ContentTabProps {
  type: ContentType;
}

const ITEMS_PER_PAGE = 20;

export function ContentTab({ type }: ContentTabProps) {
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("");

  // Sử dụng React Query để fetch và cache data
  // Không gửi search lên API, chỉ filter ở frontend
  const {
    data: response,
    isLoading,
    error,
  } = useContent({
    type,
    page,
    limit: ITEMS_PER_PAGE,
    level: level || undefined,
    // Không gửi search, sẽ filter ở frontend
  });

  const deleteMutation = useDeleteContent(type);
  const bulkCreateMutation = useBulkCreateContent(type);

  // Filter items ở frontend dựa trên search term
  const filteredItems = useMemo(() => {
    const allItems = response?.data || [];
    if (!search.trim()) {
      return allItems;
    }

    const searchLower = search.toLowerCase().trim();
    return allItems.filter((item: ContentItem) => {
      if (type === "vocab") {
        const vocab = item as VocabItem;
        return (
          vocab.term?.toLowerCase().includes(searchLower) ||
          vocab.reading?.toLowerCase().includes(searchLower) ||
          vocab.meaningVi?.some((m) => m.toLowerCase().includes(searchLower)) ||
          false
        );
      } else if (type === "kanji") {
        const kanji = item as KanjiItem;
        return (
          kanji.kanji?.toLowerCase().includes(searchLower) ||
          kanji.meaningVi?.some((m) => m.toLowerCase().includes(searchLower)) ||
          kanji.onyomi?.some((o) => o.toLowerCase().includes(searchLower)) ||
          kanji.kunyomi?.some((k) => k.toLowerCase().includes(searchLower)) ||
          false
        );
      } else {
        const grammar = item as GrammarPoint;
        return (
          grammar.title?.toLowerCase().includes(searchLower) ||
          grammar.pattern?.toLowerCase().includes(searchLower) ||
          grammar.explainVi?.toLowerCase().includes(searchLower) ||
          grammar.type?.toLowerCase().includes(searchLower) ||
          false
        );
      }
    });
  }, [response?.data, search, type]);

  const items = filteredItems;
  const total = response?.total || 0;

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("Có lỗi xảy ra khi xóa");
    }
  };

  const handleBulkUpload = async (data: unknown[]) => {
    try {
      await bulkCreateMutation.mutateAsync(
        data as Parameters<typeof bulkCreateMutation.mutateAsync>[0]
      );
      setShowBulkUpload(false);
    } catch (error) {
      console.error("Error bulk uploading:", error);
      throw error;
    }
  };

  const getColumns = () => {
    if (type === "vocab") {
      return [
        { key: "term", label: "Từ" },
        { key: "reading", label: "Cách đọc" },
        {
          key: "meaningVi",
          label: "Nghĩa",
          render: (value: unknown) =>
            Array.isArray(value) ? value.join(", ") : String(value),
        },
        { key: "level", label: "Cấp độ" },
        { key: "type", label: "Loại" },
      ];
    } else if (type === "kanji") {
      return [
        { key: "kanji", label: "Kanji" },
        {
          key: "meaningVi",
          label: "Nghĩa",
          render: (value: unknown) =>
            Array.isArray(value) ? value.join(", ") : String(value),
        },
        {
          key: "onyomi",
          label: "Onyomi",
          render: (value: unknown) =>
            Array.isArray(value)
              ? value.join(", ")
              : value
              ? String(value)
              : "-",
        },
        {
          key: "kunyomi",
          label: "Kunyomi",
          render: (value: unknown) =>
            Array.isArray(value)
              ? value.join(", ")
              : value
              ? String(value)
              : "-",
        },
        { key: "level", label: "Cấp độ" },
      ];
    } else {
      return [
        { key: "title", label: "Tiêu đề" },
        { key: "pattern", label: "Mẫu câu" },
        { key: "explainVi", label: "Giải thích" },
        { key: "level", label: "Cấp độ" },
        { key: "type", label: "Loại" },
      ];
    }
  };

  if (showBulkUpload) {
    return (
      <BulkUploadPanel
        type={type}
        onUpload={handleBulkUpload}
        onCancel={() => setShowBulkUpload(false)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              // Không reset page khi search, chỉ filter ở frontend
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4C4B0] text-gray-600"
          />
          <select
            value={level}
            onChange={(e) => {
              setLevel(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4C4B0] text-gray-700"
          >
            <option value="">Tất cả cấp độ</option>
            <option value="N5">N5</option>
            <option value="N4">N4</option>
            <option value="N3">N3</option>
            <option value="N2">N2</option>
            <option value="N1">N1</option>
          </select>
        </div>
        <button
          onClick={() => setShowBulkUpload(true)}
          className="px-4 py-2 rounded-lg bg-[#D4C4B0] text-[#5C4A37] font-medium hover:bg-[#C9B8A3] transition-colors whitespace-nowrap"
        >
          Upload hàng loạt
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại.
        </div>
      )}

      <ContentTable
        data={
          items as unknown as Array<{ _id: string; [key: string]: unknown }>
        }
        columns={getColumns()}
        onDelete={handleDelete}
        isLoading={isLoading}
      />

      {total > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <p>
            Hiển thị {(page - 1) * ITEMS_PER_PAGE + 1} -{" "}
            {Math.min(page * ITEMS_PER_PAGE, total)} / {total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Trước
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page * ITEMS_PER_PAGE >= total}
              className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
