"use client";

import { useState, useEffect, useRef } from "react";
import { RotateCcw } from "lucide-react";

interface KanjiStrokeOrderProps {
  kanji: string;
  strokes?: number;
}

// 50 màu cơ bản với khoảng cách đều nhau trong color spectrum
const BASE_COLORS = (() => {
  const colors: string[] = [];
  const hueStep = 360 / 50;

  for (let i = 0; i < 50; i++) {
    const hue = Math.floor(i * hueStep);
    const saturation = 80;
    const lightness = 55;
    colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
  }

  for (let i = colors.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [colors[i], colors[j]] = [colors[j], colors[i]];
  }

  return colors;
})();

function generateRandomColors(count: number): string[] {
  const colors: string[] = [];
  const shuffledColors = [...BASE_COLORS];
  for (let i = shuffledColors.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledColors[i], shuffledColors[j]] = [
      shuffledColors[j],
      shuffledColors[i],
    ];
  }

  for (let i = 0; i < count; i++) {
    colors.push(shuffledColors[i % shuffledColors.length]);
  }

  return colors;
}

export function KanjiStrokeOrder({ kanji, strokes }: KanjiStrokeOrderProps) {
  const [currentStroke, setCurrentStroke] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [inferredStrokes, setInferredStrokes] = useState<number | null>(null);
  const [strokeColors, setStrokeColors] = useState<string[]>([]);

  const totalStrokes = strokes ?? inferredStrokes ?? 0;

  const svgContainerRef = useRef<HTMLDivElement | null>(null);
  const renderedSvgContentRef = useRef<string | null>(null);

  // NEW: giữ danh sách path và length để animate nét
  const strokePathsRef = useRef<SVGPathElement[]>([]);
  const strokeLengthsRef = useRef<number[]>([]);

  function kanjiToUnicode(char: string): string {
    const codePoint = char.codePointAt(0);
    if (!codePoint) return "";
    return codePoint.toString(16).padStart(5, "0");
  }

  // Fetch SVG
  useEffect(() => {
    async function fetchKanjiSvg() {
      try {
        setIsLoading(true);
        setHasError(false);
        setSvgContent(null);
        setCurrentStroke(0);
        setStrokeColors([]);
        setInferredStrokes(null);
        renderedSvgContentRef.current = null;
        strokePathsRef.current = [];
        strokeLengthsRef.current = [];

        const unicode = kanjiToUnicode(kanji);
        if (!unicode) throw new Error("Invalid kanji");

        const url = `/kanji/${unicode}.svg`;
        const response = await fetch(url);
        if (!response.ok)
          throw new Error(`Failed to fetch SVG: ${response.status}`);

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
      strokePathsRef.current = [];
      strokeLengthsRef.current = [];
    }
  }, [kanji]);

  // Render SVG vào DOM
  useEffect(() => {
    if (!svgContainerRef.current || !svgContent) {
      renderedSvgContentRef.current = null;
      strokePathsRef.current = [];
      strokeLengthsRef.current = [];
      return;
    }

    if (renderedSvgContentRef.current !== svgContent) {
      const container = svgContainerRef.current;
      container.innerHTML = svgContent;
      renderedSvgContentRef.current = svgContent;
    }

    const svgEl = svgContainerRef.current.querySelector("svg");
    if (!svgEl) return;

    // Scale SVG
    if (!svgEl.style.width) {
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

    // Lấy danh sách stroke path & sắp xếp theo id -s1, -s2, ...
    const strokePaths = Array.from(
      svgEl.querySelectorAll<SVGPathElement>('[id*="-s"]')
    );

    strokePaths.sort((a, b) => {
      const getIndex = (el: SVGPathElement) => {
        const m = (el.id || "").match(/-s(\d+)/);
        return m ? parseInt(m[1], 10) : Number.MAX_SAFE_INTEGER;
      };
      return getIndex(a) - getIndex(b);
    });

    strokePathsRef.current = strokePaths;
    strokeLengthsRef.current = strokePaths.map((p) => {
      try {
        return p.getTotalLength();
      } catch {
        return 0;
      }
    });

    // Infer total strokes nếu chưa có
    if (!strokes && strokePaths.length > 0) {
      setInferredStrokes(strokePaths.length);
    }

    // Khởi tạo style cho tất cả nét (ẩn bằng dashoffset)
    strokePaths.forEach((path, index) => {
      const length = strokeLengthsRef.current[index] ?? 0;

      path.style.setProperty("fill", "none", "important");
      path.style.setProperty("stroke-width", "3", "important");
      path.style.setProperty("stroke-linecap", "round", "important");
      path.style.setProperty("stroke-linejoin", "round", "important");
      path.style.setProperty("stroke", "#555", "important");

      path.style.strokeDasharray = `${length}`;
      path.style.strokeDashoffset = `${length}`;
      path.style.opacity = "0.15";
    });
  }, [svgContent, strokes]);

  // Random màu khi có tổng stroke
  useEffect(() => {
    if (totalStrokes > 0) {
      const colors = generateRandomColors(totalStrokes);
      setStrokeColors(colors);
    }
  }, [totalStrokes]);

  // ANIMATION: mỗi khi currentStroke tăng, animate nét tương ứng
  useEffect(() => {
    const paths = strokePathsRef.current;
    if (!paths.length || totalStrokes <= 0) return;

    paths.forEach((path, index) => {
      const length = strokeLengthsRef.current[index] ?? 0;
      const isDrawn = index < currentStroke;

      // màu
      path.style.setProperty(
        "stroke",
        isDrawn ? strokeColors[index] || "#111" : "#555",
        "important"
      );

      // thiết lập animation vẽ nét
      path.style.transition =
        "stroke-dashoffset 0.7s ease-out, opacity 0.3s ease-out";

      if (isDrawn) {
        // nét đã (đang) được vẽ: dashoffset 0
        path.style.strokeDasharray = `${length}`;
        path.style.strokeDashoffset = "0";
        path.style.opacity = "1";
      } else {
        // nét chưa vẽ: ẩn
        path.style.strokeDasharray = `${length}`;
        path.style.strokeDashoffset = `${length}`;
        path.style.opacity = "0.15";
      }
    });
  }, [currentStroke, strokeColors, totalStrokes]);

  // Auto-play
  useEffect(() => {
    if (!totalStrokes || !svgContent || strokeColors.length === 0) return;
    setIsPlaying(true);
    setCurrentStroke(0);
  }, [svgContent, totalStrokes, strokeColors.length]);

  useEffect(() => {
    if (!isPlaying || !totalStrokes || totalStrokes <= 0) return;

    const interval = setInterval(() => {
      setCurrentStroke((prev) => {
        if (prev >= totalStrokes) {
          setIsPlaying(false);
          return totalStrokes;
        }
        return prev + 1;
      });
    }, 800); // tốc độ: 0.8s / nét

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
    <div className="relative flex h-full w-full flex-col rounded-lg border border-gray-200 bg-white p-8">
      <button
        onClick={handleReset}
        className="absolute right-4 top-4 rounded-full bg-white p-2 shadow-md transition-colors hover:bg-gray-50"
        title="Reload"
      >
        <RotateCcw className="h-5 w-5 text-gray-700" />
      </button>

      <div className="mb-6 flex justify-center">
        <div className="text-8xl font-bold text-gray-900">{kanji}</div>
      </div>

      <div
        ref={svgContainerRef}
        className="flex flex-1 items-center justify-center"
        style={{ filter: "drop-shadow(0 0 1px rgba(0,0,0,0.1))" }}
      />
    </div>
  );
}
