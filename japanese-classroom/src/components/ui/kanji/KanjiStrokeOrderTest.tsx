"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X } from "lucide-react";
import { HeartsDisplay } from "./HeartsDisplay";
import { KanjiHintModal } from "./KanjiHintModal";

// Type for SVG path element with custom click handler
interface SVGPathWithHandler extends SVGPathElement {
  __clickHandler?: (e: MouseEvent) => void;
}

interface KanjiStrokeOrderTestProps {
  kanji: string;
  strokes?: number;
  onComplete: () => void;
  onSkip?: () => void;
  isRetry?: boolean;
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

interface ErrorMarker {
  x: number;
  y: number;
  id: string;
}

export function KanjiStrokeOrderTest({
  kanji,
  strokes,
  onComplete,
  onSkip,
  isRetry = false,
}: KanjiStrokeOrderTestProps) {
  const [currentStroke, setCurrentStroke] = useState(0);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [inferredStrokes, setInferredStrokes] = useState<number | null>(null);
  const [strokeColors, setStrokeColors] = useState<string[]>([]);
  const [errorMarkers, setErrorMarkers] = useState<ErrorMarker[]>([]);
  const [hearts, setHearts] = useState(3);
  const [showHintModal, setShowHintModal] = useState(false);
  const [removingHeartIndex, setRemovingHeartIndex] = useState<number | null>(
    null
  );

  const totalStrokes = strokes ?? inferredStrokes ?? 0;

  const svgContainerRef = useRef<HTMLDivElement | null>(null);
  const renderedSvgContentRef = useRef<string | null>(null);
  const hasCompletedRef = useRef<boolean>(false);

  // background strokes, foreground strokes, lengths, number labels
  const bgStrokePathsRef = useRef<SVGPathElement[]>([]);
  const fgStrokePathsRef = useRef<SVGPathElement[]>([]);
  const strokeLengthsRef = useRef<number[]>([]);
  const labelTextsRef = useRef<SVGTextElement[]>([]);

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
        setErrorMarkers([]);
        setHearts(3);
        setShowHintModal(false);
        setRemovingHeartIndex(null);
        hasCompletedRef.current = false;
        renderedSvgContentRef.current = null;
        bgStrokePathsRef.current = [];
        fgStrokePathsRef.current = [];
        strokeLengthsRef.current = [];
        labelTextsRef.current = [];

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
    }
  }, [kanji]);

  // Render SVG vào DOM
  useEffect(() => {
    if (!svgContainerRef.current || !svgContent) {
      renderedSvgContentRef.current = null;
      bgStrokePathsRef.current = [];
      fgStrokePathsRef.current = [];
      strokeLengthsRef.current = [];
      labelTextsRef.current = [];
      return;
    }

    if (renderedSvgContentRef.current !== svgContent) {
      const container = svgContainerRef.current;
      container.innerHTML = svgContent;
      renderedSvgContentRef.current = svgContent;

      // Immediately hide all text elements to prevent flash of numbers
      const svgElTemp = container.querySelector("svg");
      if (svgElTemp) {
        const allTexts = svgElTemp.querySelectorAll<SVGTextElement>("text");
        allTexts.forEach((text) => {
          text.style.setProperty("opacity", "0", "important");
          text.style.setProperty("visibility", "hidden", "important");
        });
      }
    }

    const svgEl = svgContainerRef.current.querySelector("svg");
    if (!svgEl) return;

    // Scale SVG to fit container - make it larger
    const container = svgContainerRef.current;
    if (container && (!svgEl.style.width || svgEl.style.width === "")) {
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      // Use 95% of container size to make it larger
      const maxSize = Math.min(containerWidth * 0.95, containerHeight * 0.95);

      // Set SVG to fit container while maintaining aspect ratio
      svgEl.style.setProperty("width", `${maxSize}px`, "important");
      svgEl.style.setProperty("height", `${maxSize}px`, "important");
      svgEl.style.setProperty("max-width", `${maxSize}px`, "important");
      svgEl.style.setProperty("max-height", `${maxSize}px`, "important");
      svgEl.style.setProperty("display", "block", "important");
      svgEl.style.setProperty("margin", "auto", "important");

      if (!svgEl.hasAttribute("preserveAspectRatio")) {
        svgEl.setAttribute("preserveAspectRatio", "xMidYMid meet");
      }
    }

    // ----- STROKES -----
    const strokePaths = Array.from(
      svgEl.querySelectorAll<SVGPathElement>('[id*="-s"]')
    );

    if (!strokePaths.length) {
      bgStrokePathsRef.current = [];
      fgStrokePathsRef.current = [];
      strokeLengthsRef.current = [];
      labelTextsRef.current = [];
      return;
    }

    strokePaths.sort((a, b) => {
      const getIndex = (el: SVGPathElement) => {
        const m = (el.id || "").match(/-s(\d+)/);
        return m ? parseInt(m[1], 10) : Number.MAX_SAFE_INTEGER;
      };
      return getIndex(a) - getIndex(b);
    });

    bgStrokePathsRef.current = [];
    fgStrokePathsRef.current = [];
    strokeLengthsRef.current = [];

    strokePaths.forEach((path) => {
      const length = (() => {
        try {
          return path.getTotalLength();
        } catch {
          return 0;
        }
      })();

      strokeLengthsRef.current.push(length);

      // background stroke (xám, full, clickable)
      path.style.setProperty("fill", "none", "important");
      path.style.setProperty("stroke-width", "2.4", "important");
      path.style.setProperty("stroke-linecap", "round", "important");
      path.style.setProperty("stroke-linejoin", "round", "important");
      path.style.setProperty("stroke", "#d4d4d8", "important");
      path.style.setProperty("opacity", "1", "important");
      path.style.strokeDasharray = "";
      path.style.strokeDashoffset = "";
      path.style.cursor = "pointer";
      bgStrokePathsRef.current.push(path);

      // foreground stroke (màu, animate) - hidden initially
      const overlay = path.cloneNode(false) as SVGPathElement;
      overlay.removeAttribute("id");
      overlay.setAttribute("data-layer", "fg-stroke");
      overlay.style.setProperty("fill", "none", "important");
      overlay.style.setProperty("stroke-width", "3", "important");
      overlay.style.setProperty("stroke-linecap", "round", "important");
      overlay.style.setProperty("stroke-linejoin", "round", "important");
      overlay.style.setProperty("stroke", "#111827", "important");
      overlay.style.strokeDasharray = `${length}`;
      overlay.style.strokeDashoffset = `${length}`;
      overlay.style.opacity = "0";
      overlay.style.pointerEvents = "none";

      path.parentNode?.insertBefore(overlay, path.nextSibling);
      fgStrokePathsRef.current.push(overlay);
    });

    if (!strokes && strokePaths.length > 0) {
      setInferredStrokes(strokePaths.length);
    }

    // ----- STROKE NUMBER LABELS -----
    const allTexts = Array.from(svgEl.querySelectorAll<SVGTextElement>("text"));
    const numberTexts = allTexts
      .map((el) => {
        const txt = (el.textContent || "").trim();
        const n = parseInt(txt, 10);
        return Number.isNaN(n) ? null : { el, n };
      })
      .filter((x): x is { el: SVGTextElement; n: number } => x !== null)
      .sort((a, b) => a.n - b.n)
      .map((x) => x.el);

    labelTextsRef.current = numberTexts;

    // Hide labels immediately to prevent flash of numbers
    numberTexts.forEach((t) => {
      // Set opacity to 0 immediately without transition first
      t.style.setProperty("opacity", "0", "important");
      t.style.setProperty("fill", "#9ca3af", "important");
      // Then add transition for future changes
      t.style.transition = "opacity 0.3s ease-out, fill 0.3s ease-out";
      // Also hide via visibility to ensure it's completely hidden
      t.style.setProperty("visibility", "hidden", "important");
    });
  }, [svgContent, strokes]);

  // Random màu
  useEffect(() => {
    if (totalStrokes > 0) {
      const colors = generateRandomColors(totalStrokes);
      setStrokeColors(colors);
    }
  }, [totalStrokes]);

  // Animate strokes + labels theo currentStroke
  useEffect(() => {
    const fgPaths = fgStrokePathsRef.current;
    const labels = labelTextsRef.current;
    if (!fgPaths.length || totalStrokes <= 0) return;

    fgPaths.forEach((path, index) => {
      const length = strokeLengthsRef.current[index] ?? 0;
      const isDrawn = index < currentStroke;

      path.style.setProperty(
        "stroke",
        strokeColors[index] || "#111827",
        "important"
      );
      path.style.transition =
        "stroke-dashoffset 0.6s ease-out, opacity 0.3s ease-out";

      if (isDrawn) {
        path.style.strokeDasharray = `${length}`;
        path.style.strokeDashoffset = "0";
        path.style.opacity = "1";
      } else {
        path.style.strokeDasharray = `${length}`;
        path.style.strokeDashoffset = `${length}`;
        path.style.opacity = "0";
      }
    });

    // Label: cùng màu stroke, fade-in đúng thời điểm
    const maxIndex = Math.min(labels.length, fgPaths.length);
    for (let i = 0; i < maxIndex; i++) {
      const label = labels[i];
      const isDrawn = i < currentStroke;
      if (isDrawn) {
        label.style.setProperty(
          "fill",
          strokeColors[i] || "#111827",
          "important"
        );
        label.style.setProperty("opacity", "1", "important");
        label.style.setProperty("visibility", "visible", "important");
      } else {
        label.style.setProperty("fill", "#9ca3af", "important");
        label.style.setProperty("opacity", "0", "important");
        label.style.setProperty("visibility", "hidden", "important");
      }
    }

    // Check if all strokes are completed - only call once
    if (
      currentStroke >= totalStrokes &&
      totalStrokes > 0 &&
      !hasCompletedRef.current
    ) {
      hasCompletedRef.current = true;
      // Use setTimeout to avoid calling during render
      setTimeout(() => {
        onComplete();
      }, 0);
    }
  }, [currentStroke, strokeColors, totalStrokes, onComplete]);

  // Handle stroke click
  const handleStrokeClick = useCallback(
    (event: MouseEvent, strokeIndex: number) => {
      if (strokeIndex === currentStroke) {
        // Correct stroke - show it
        setCurrentStroke((prev) => prev + 1);
        // Clear error markers
        setErrorMarkers([]);
      } else {
        // Wrong stroke - show error marker at click position
        const container = svgContainerRef.current;
        if (!container) return;

        // Get container's bounding rect
        const containerRect = container.getBoundingClientRect();
        // Calculate position relative to container
        const x = event.clientX - containerRect.left;
        const y = event.clientY - containerRect.top;

        const errorId = `error-${Date.now()}-${Math.random()}`;
        setErrorMarkers((prev) => [...prev, { x, y, id: errorId }]);

        // Remove error marker after 1 second
        setTimeout(() => {
          setErrorMarkers((prev) => prev.filter((m) => m.id !== errorId));
        }, 1000);

        // Decrease hearts (remove from left to right)
        setHearts((prev) => {
          if (prev > 0) {
            // Calculate which heart to remove (from left: 0, 1, 2)
            // When hearts = 3, remove index 0 (leftmost)
            // When hearts = 2, remove index 1 (leftmost of remaining)
            // When hearts = 1, remove index 2 (last one)
            const currentHeartIndex = 3 - prev; // Index from left
            setRemovingHeartIndex(currentHeartIndex);

            const newHearts = prev - 1;
            if (newHearts === 0) {
              // Show hint modal when all hearts are lost
              setTimeout(() => {
                setShowHintModal(true);
              }, 500);
            }

            // Clear removing animation after animation completes
            setTimeout(() => {
              setRemovingHeartIndex(null);
            }, 300);

            return newHearts;
          }
          return prev;
        });
      }
    },
    [currentStroke]
  );

  function handleRetry() {
    setShowHintModal(false);
    setCurrentStroke(0);
    setHearts(3);
    setErrorMarkers([]);
    setRemovingHeartIndex(null);
    hasCompletedRef.current = false;
  }

  // Attach click handlers to background strokes
  useEffect(() => {
    const bgPaths = bgStrokePathsRef.current;
    if (!bgPaths.length || !svgContent) return;

    const clickHandlers: Array<(e: MouseEvent) => void> = [];

    bgPaths.forEach((path, index) => {
      // Remove existing listeners first
      const pathWithHandler = path as SVGPathWithHandler;
      const existingHandler = pathWithHandler.__clickHandler;
      if (existingHandler) {
        path.removeEventListener("click", existingHandler);
      }

      // Only allow clicking on strokes that haven't been drawn yet
      if (index >= currentStroke) {
        const handler = (e: MouseEvent) => {
          e.stopPropagation();
          handleStrokeClick(e, index);
        };
        clickHandlers.push(handler);
        pathWithHandler.__clickHandler = handler;
        path.addEventListener("click", handler, { passive: true });
        path.style.cursor = "pointer";
        path.style.pointerEvents = "auto";
      } else {
        path.style.cursor = "default";
        path.style.pointerEvents = "none";
      }
    });

    return () => {
      bgPaths.forEach((path) => {
        const pathWithHandler = path as SVGPathWithHandler;
        const existingHandler = pathWithHandler.__clickHandler;
        if (existingHandler) {
          path.removeEventListener("click", existingHandler);
          delete pathWithHandler.__clickHandler;
        }
      });
    };
  }, [currentStroke, svgContent, handleStrokeClick]);

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
    <>
      <div className="relative flex h-full w-full flex-col rounded-lg border border-gray-200 bg-white p-4 overflow-hidden">
        <div className="mb-4 text-center flex-shrink-0 relative">
          <div className="relative flex items-center justify-center">
            <p className="text-sm text-gray-600">
              Click vào các nét vẽ theo thứ tự đúng
            </p>
            <div className="absolute right-0 top-0">
              <HeartsDisplay
                hearts={hearts}
                totalHearts={3}
                removingHeartIndex={removingHeartIndex}
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Nét {currentStroke + 1}/{totalStrokes}
          </p>
          {isRetry && onSkip && (
            <button
              onClick={onSkip}
              className="mt-2 px-4 py-2 text-sm rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
            >
              Bỏ qua (tự tính đúng)
            </button>
          )}
        </div>

        <div className="flex-1 relative overflow-hidden">
          <div
            ref={svgContainerRef}
            className="w-full h-full flex items-center justify-center"
            style={{ filter: "drop-shadow(0 0 1px rgba(0,0,0,0.1))" }}
          >
            {/* Error markers overlay */}
            {errorMarkers.length > 0 && (
              <div className="absolute inset-0 pointer-events-none z-10">
                {errorMarkers.map((marker) => (
                  <div
                    key={marker.id}
                    className="absolute"
                    style={{
                      left: `${marker.x}px`,
                      top: `${marker.y}px`,
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    <X className="w-6 h-6 text-red-500" strokeWidth="3" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <KanjiHintModal
        visible={showHintModal}
        kanji={kanji}
        strokes={strokes}
        onRetry={handleRetry}
      />
    </>
  );
}
