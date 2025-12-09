"use client";

import { useState, useEffect, useRef } from "react";
import { RotateCcw } from "lucide-react";

interface KanjiStrokeOrderProps {
  kanji: string;
  /**
   * Optional: total stroke count.
   * If omitted, the component will try to infer it from the SVG (KanjiVG -sN ids).
   */
  strokes?: number;
}

// 50 màu cơ bản với khoảng cách đều nhau trong color spectrum
const BASE_COLORS = (() => {
  const colors: string[] = [];
  const hueStep = 360 / 50; // Khoảng cách đều giữa các màu (7.2 độ)

  for (let i = 0; i < 50; i++) {
    const hue = Math.floor(i * hueStep);
    // Saturation và lightness cố định để đảm bảo màu rực rỡ và dễ nhìn
    const saturation = 80; // Saturation cao để màu rực rỡ
    const lightness = 55; // Lightness vừa phải để dễ nhìn
    colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
  }

  // Shuffle mảng để có sự ngẫu nhiên khi chọn màu
  for (let i = colors.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [colors[i], colors[j]] = [colors[j], colors[i]];
  }

  return colors;
})();

// Chọn màu từ 50 màu cơ bản cho các nét
function generateRandomColors(count: number): string[] {
  const colors: string[] = [];
  // Tạo một bản sao của BASE_COLORS để shuffle lại mỗi lần
  const shuffledColors = [...BASE_COLORS];
  for (let i = shuffledColors.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledColors[i], shuffledColors[j]] = [
      shuffledColors[j],
      shuffledColors[i],
    ];
  }

  // Chọn màu từ mảng đã shuffle
  for (let i = 0; i < count; i++) {
    colors.push(shuffledColors[i % shuffledColors.length]);
  }

  return colors;
}

/**
 * Component to display Kanji stroke order using local KanjiVG SVG files.
 * SVG files are expected under: public/kanji/{unicode}.svg
 * e.g. 学 -> public/kanji/05b66.svg
 */
export function KanjiStrokeOrder({ kanji, strokes }: KanjiStrokeOrderProps) {
  const [currentStroke, setCurrentStroke] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [inferredStrokes, setInferredStrokes] = useState<number | null>(null);
  const [strokeColors, setStrokeColors] = useState<string[]>([]);

  // Lấy totalStrokes trực tiếp từ strokes prop, nếu không có thì dùng inferredStrokes
  const totalStrokes = strokes ?? inferredStrokes;

  const svgContainerRef = useRef<HTMLDivElement | null>(null);
  const renderedSvgContentRef = useRef<string | null>(null);

  // Convert kanji character to Unicode hex (KanjiVG filename format)
  function kanjiToUnicode(char: string): string {
    // Use codePointAt to be safe with surrogate pairs
    const codePoint = char.codePointAt(0);
    if (!codePoint) return "";
    // KanjiVG uses 5-digit hex with leading zero (e.g. 05b66)
    return codePoint.toString(16).padStart(5, "0");
  }

  // Fetch SVG from local public/kanji directory
  useEffect(() => {
    async function fetchKanjiSvg() {
      try {
        setIsLoading(true);
        setHasError(false);
        setSvgContent(null);
        setCurrentStroke(0);
        setStrokeColors([]); // Reset colors when kanji changes
        setInferredStrokes(null); // Reset inferred strokes when kanji changes
        renderedSvgContentRef.current = null; // Reset rendered SVG ref

        const unicode = kanjiToUnicode(kanji);
        if (!unicode) {
          throw new Error("Invalid kanji");
        }

        // Served from Next.js public directory
        const url = `/kanji/${unicode}.svg`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Failed to fetch SVG: ${response.status}`);
        }

        const svgText = await response.text();
        const match = svgText.match(/<svg[\s\S]*<\/svg>/i);
        const cleanedSvg = match ? match[0] : svgText;
        setSvgContent(cleanedSvg);
      } catch (error) {
        console.error("Error fetching kanji SVG:", error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    }

    if (kanji) {
      fetchKanjiSvg();
    } else {
      setSvgContent(null);
      setHasError(false);
      setIsLoading(false);
      setStrokeColors([]);
      setInferredStrokes(null);
      renderedSvgContentRef.current = null;
    }
  }, [kanji]);

  // Render SVG vào DOM một lần khi svgContent thay đổi
  useEffect(() => {
    if (!svgContainerRef.current || !svgContent) {
      renderedSvgContentRef.current = null;
      return;
    }

    // Chỉ set innerHTML khi svgContent thay đổi (tránh reset không cần thiết)
    if (renderedSvgContentRef.current !== svgContent) {
      const container = svgContainerRef.current;
      container.innerHTML = svgContent;
      renderedSvgContentRef.current = svgContent;
    }

    // Infer total strokes nếu chưa có
    if (!strokes && svgContainerRef.current) {
      const svgEl = svgContainerRef.current.querySelector("svg");
      if (svgEl) {
        const strokePaths =
          svgEl.querySelectorAll<SVGPathElement>('[id*="-s"]');
        if (strokePaths.length > 0) {
          setInferredStrokes(strokePaths.length);
        }
      }
    }
  }, [svgContent, strokes]);

  // Generate random colors when totalStrokes is available
  useEffect(() => {
    if (totalStrokes && totalStrokes > 0) {
      const colors = generateRandomColors(totalStrokes);
      setStrokeColors(colors);
    }
  }, [totalStrokes]);

  // Apply stroke visibility / emphasis based on currentStroke and scale SVG
  useEffect(() => {
    if (!svgContainerRef.current || !svgContent) return;

    const svgEl = svgContainerRef.current.querySelector("svg");
    if (!svgEl) return;

    // Scale SVG – chỉ set một lần, không reset lại
    if (!svgEl.style.width || svgEl.style.width === "") {
      svgEl.style.setProperty("width", "100%", "important");
      svgEl.style.setProperty("height", "100%", "important");
      svgEl.style.setProperty("max-width", "100%", "important");
      svgEl.style.setProperty("max-height", "100%", "important");
      svgEl.style.setProperty("display", "block", "important");
      svgEl.style.setProperty("margin", "auto", "important");
      if (!svgEl.hasAttribute("preserveAspectRatio")) {
        svgEl.setAttribute("preserveAspectRatio", "xMidYMid meet");
      }
    }

    const strokePaths = Array.from(
      svgEl.querySelectorAll<SVGPathElement>('[id*="-s"]')
    );

    if (!strokePaths.length) return;

    const maxStrokes = totalStrokes ?? 0;
    const isComplete = currentStroke >= maxStrokes && maxStrokes > 0;

    strokePaths.forEach((path, index) => {
      const visible = isComplete || index < currentStroke;

      // Chỉ update style, không reset toàn bộ
      path.style.setProperty("opacity", visible ? "1" : "0.15", "important");
      path.style.setProperty(
        "stroke",
        visible ? strokeColors[index] || "#111" : "#555",
        "important"
      );
      path.style.setProperty("fill", "none", "important");
      path.style.setProperty("stroke-width", "3", "important");
      path.style.setProperty("stroke-linecap", "round", "important");
      path.style.setProperty("stroke-linejoin", "round", "important");
    });
  }, [currentStroke, svgContent, strokeColors, totalStrokes]);

  // Auto-play animation when SVG is loaded and totalStrokes is available
  useEffect(() => {
    if (
      !totalStrokes ||
      totalStrokes <= 0 ||
      !svgContent ||
      strokeColors.length === 0
    )
      return;

    // Auto-start animation
    setIsPlaying(true);
    setCurrentStroke(0);
  }, [svgContent, totalStrokes, strokeColors.length]);

  // Auto-play animation
  useEffect(() => {
    if (!isPlaying || !totalStrokes || totalStrokes <= 0) return;

    const interval = setInterval(() => {
      setCurrentStroke((prev) => {
        if (prev >= totalStrokes) {
          // Đã vẽ xong - đảm bảo tất cả nét đều hiển thị với màu đầy đủ
          setIsPlaying(false);
          return totalStrokes; // Đảm bảo currentStroke = totalStrokes để tất cả nét đều hiển thị
        }
        return prev + 1;
      });
    }, 800); // 800ms per stroke

    return () => clearInterval(interval);
  }, [isPlaying, totalStrokes]);

  function handleReset() {
    setCurrentStroke(0);
    setIsPlaying(true);
  }

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-lg border border-gray-200 bg-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="text-sm text-gray-600">Loading stroke order...</p>
        </div>
      </div>
    );
  }

  if (hasError || !svgContent) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-lg border border-gray-200 bg-white">
        <div className="text-center text-gray-400">
          <div className="mb-4 text-6xl">{kanji}</div>
          <p className="text-sm">Stroke order not available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full w-full items-center justify-center rounded-lg border border-gray-200 bg-white p-8">
      {/* Reload Button - Top Right */}
      <button
        onClick={handleReset}
        className="absolute right-4 top-4 rounded-full bg-white p-2 shadow-md transition-colors hover:bg-gray-50"
        title="Reload"
      >
        <RotateCcw className="h-5 w-5 text-gray-700" />
      </button>

      {/* SVG Display - Kanji ở giữa, to */}
      <div
        ref={svgContainerRef}
        className="flex h-full w-full min-h-[400px] items-center justify-center"
        style={{
          filter: "drop-shadow(0 0 1px rgba(0,0,0,0.1))",
        }}
      />
    </div>
  );
}
