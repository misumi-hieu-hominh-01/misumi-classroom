"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";

interface KanjiStrokeOrderProps {
  kanji: string;
  /**
   * Optional: total stroke count.
   * If omitted, the component will try to infer it from the SVG (KanjiVG -sN ids).
   */
  strokes?: number;
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
  const [totalStrokes, setTotalStrokes] = useState<number | null>(
    strokes ?? null
  );

  const svgContainerRef = useRef<HTMLDivElement | null>(null);

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
        setSvgContent(svgText);
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
    }
  }, [kanji]);

  // After SVG is rendered into the DOM, infer total strokes if not provided
  useEffect(() => {
    if (!svgContent || strokes) return; // nếu props đã có strokes thì ưu tiên dùng

    // Đợi React mount SVG vào DOM
    if (!svgContainerRef.current) return;

    const svgEl = svgContainerRef.current.querySelector("svg");
    if (!svgEl) return;

    // KanjiVG đặt id dạng: kvg:05b66-s1, kvg:05b66-s2, ...
    const strokePaths = svgEl.querySelectorAll<SVGPathElement>('[id*="-s"]');

    if (strokePaths.length > 0) {
      setTotalStrokes(strokePaths.length);
    }
  }, [svgContent, strokes]);

  // Apply stroke visibility / emphasis based on currentStroke
  useEffect(() => {
    if (!svgContainerRef.current || !svgContent) return;

    const svgEl = svgContainerRef.current.querySelector("svg");
    if (!svgEl) return;

    const strokePaths = Array.from(
      svgEl.querySelectorAll<SVGPathElement>('[id*="-s"]')
    );

    // Nếu không có info số nét, cứ highlight hết
    if (!strokePaths.length) return;

    strokePaths.forEach((path, index) => {
      // index < currentStroke => nét đã vẽ / đang vẽ
      if (index < currentStroke) {
        path.style.opacity = "1";
        path.style.stroke = "#111";
      } else {
        // Nét chưa tới -> mờ đi
        path.style.opacity = "0.15";
        path.style.stroke = "#555";
      }

      path.style.fill = "none"; // cho chắc
      path.style.strokeWidth = "3";
      path.style.strokeLinecap = "round";
      path.style.strokeLinejoin = "round";
    });
  }, [currentStroke, svgContent]);

  // Auto-play animation
  useEffect(() => {
    const maxStrokes = totalStrokes ?? strokes;
    if (!isPlaying || !maxStrokes || maxStrokes <= 0) return;

    const interval = setInterval(() => {
      setCurrentStroke((prev) => {
        if (prev >= maxStrokes) {
          // Đã vẽ xong
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 800); // 800ms per stroke

    return () => clearInterval(interval);
  }, [isPlaying, totalStrokes, strokes]);

  function handlePlay() {
    const maxStrokes = totalStrokes ?? strokes;
    if (!maxStrokes || maxStrokes <= 0) return;

    if (currentStroke >= maxStrokes) {
      setCurrentStroke(0);
    }
    setIsPlaying(true);
  }

  function handlePause() {
    setIsPlaying(false);
  }

  function handleReset() {
    setCurrentStroke(0);
    setIsPlaying(false);
  }

  const maxStrokes = totalStrokes ?? strokes ?? 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="text-sm text-gray-600">Loading stroke order...</p>
        </div>
      </div>
    );
  }

  if (hasError || !svgContent) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center text-gray-400">
          <div className="mb-4 text-6xl">{kanji}</div>
          <p className="text-sm">Stroke order not available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* SVG Display */}
      <div className="mb-4 flex flex-1 items-center justify-center">
        <div
          ref={svgContainerRef}
          className="h-full w-full"
          style={{
            filter: "drop-shadow(0 0 1px rgba(0,0,0,0.1))",
          }}
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      </div>

      {/* Controls */}
      <div className="space-y-3">
        {/* Progress Bar */}
        {maxStrokes > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>
                Stroke {Math.min(currentStroke, maxStrokes)}/{maxStrokes}
              </span>
              <span>
                {Math.round(
                  (Math.min(currentStroke, maxStrokes) / maxStrokes) * 100
                )}
                %
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{
                  width: `${
                    (Math.min(currentStroke, maxStrokes) / maxStrokes) * 100
                  }%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={handleReset}
            className="rounded-lg bg-gray-200 p-2 transition-colors hover:bg-gray-300"
            title="Reset"
          >
            <RotateCcw className="h-5 w-5 text-gray-700" />
          </button>

          {isPlaying ? (
            <button
              onClick={handlePause}
              className="flex items-center gap-2 rounded-lg bg-blue-500 px-6 py-2 text-white transition-colors hover:bg-blue-600"
            >
              <Pause className="h-5 w-5" />
              Pause
            </button>
          ) : (
            <button
              onClick={handlePlay}
              className="flex items-center gap-2 rounded-lg bg-blue-500 px-6 py-2 text-white transition-colors hover:bg-blue-600"
              disabled={maxStrokes === 0}
            >
              <Play className="h-5 w-5" />
              Play
            </button>
          )}
        </div>

        {/* Manual Stroke Slider */}
        {maxStrokes > 0 && (
          <div className="px-2">
            <input
              type="range"
              min={0}
              max={maxStrokes}
              value={Math.min(currentStroke, maxStrokes)}
              onChange={(e) => {
                setCurrentStroke(parseInt(e.target.value, 10));
                setIsPlaying(false);
              }}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-blue-500"
            />
          </div>
        )}
      </div>
    </div>
  );
}
