"use client";

import { useState, useEffect } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";

interface KanjiStrokeOrderProps {
	kanji: string;
	strokes?: number;
}

/**
 * Component to display Kanji stroke order using KanjiVG
 * SVG files from: https://github.com/KanjiVG/kanjivg
 */
export function KanjiStrokeOrder({ kanji, strokes }: KanjiStrokeOrderProps) {
	const [currentStroke, setCurrentStroke] = useState(0);
	const [isPlaying, setIsPlaying] = useState(false);
	const [svgContent, setSvgContent] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [hasError, setHasError] = useState(false);

	// Convert kanji character to unicode hex (for KanjiVG filename)
	function kanjiToUnicode(char: string): string {
		const code = char.charCodeAt(0);
		return code.toString(16).padStart(5, "0");
	}

	// Fetch SVG from KanjiVG repository
	useEffect(() => {
		async function fetchKanjiSvg() {
			try {
				setIsLoading(true);
				setHasError(false);
				
				const unicode = kanjiToUnicode(kanji);
				const url = `https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/${unicode}.svg`;
				
				const response = await fetch(url);
				
				if (!response.ok) {
					throw new Error("Failed to fetch SVG");
				}
				
				const svgText = await response.text();
				setSvgContent(svgText);
				setIsLoading(false);
			} catch (error) {
				console.error("Error fetching kanji SVG:", error);
				setHasError(true);
				setIsLoading(false);
			}
		}

		if (kanji) {
			fetchKanjiSvg();
		}
	}, [kanji]);

	// Auto-play animation
	useEffect(() => {
		if (!isPlaying || !strokes) return;

		const interval = setInterval(() => {
			setCurrentStroke((prev) => {
				if (prev >= (strokes || 0)) {
					setIsPlaying(false);
					return prev;
				}
				return prev + 1;
			});
		}, 800); // 800ms per stroke

		return () => clearInterval(interval);
	}, [isPlaying, strokes]);

	function handlePlay() {
		if (currentStroke >= (strokes || 0)) {
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

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-full">
				<div className="text-center">
					<div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
					<p className="text-gray-600 text-sm">Loading stroke order...</p>
				</div>
			</div>
		);
	}

	if (hasError || !svgContent) {
		return (
			<div className="flex items-center justify-center h-full">
				<div className="text-center text-gray-400">
					<div className="text-6xl mb-4">{kanji}</div>
					<p className="text-sm">Stroke order not available</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full">
			{/* SVG Display */}
			<div className="flex-1 flex items-center justify-center mb-4">
				<div
					className="w-full h-full"
					dangerouslySetInnerHTML={{
						__html: svgContent,
					}}
					style={{
						filter: "drop-shadow(0 0 1px rgba(0,0,0,0.1))",
					}}
				/>
			</div>

			{/* Controls */}
			<div className="space-y-3">
				{/* Progress Bar */}
				{strokes && (
					<div className="space-y-2">
						<div className="flex items-center justify-between text-xs text-gray-600">
							<span>Stroke {currentStroke}/{strokes}</span>
							<span>{Math.round((currentStroke / strokes) * 100)}%</span>
						</div>
						<div className="h-2 bg-gray-200 rounded-full overflow-hidden">
							<div
								className="h-full bg-blue-500 transition-all duration-300"
								style={{ width: `${(currentStroke / strokes) * 100}%` }}
							/>
						</div>
					</div>
				)}

				{/* Control Buttons */}
				<div className="flex items-center justify-center gap-2">
					<button
						onClick={handleReset}
						className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors"
						title="Reset"
					>
						<RotateCcw className="w-5 h-5 text-gray-700" />
					</button>
					
					{isPlaying ? (
						<button
							onClick={handlePause}
							className="px-6 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors flex items-center gap-2"
						>
							<Pause className="w-5 h-5" />
							Pause
						</button>
					) : (
						<button
							onClick={handlePlay}
							className="px-6 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors flex items-center gap-2"
						>
							<Play className="w-5 h-5" />
							Play
						</button>
					)}
				</div>

				{/* Manual Stroke Slider */}
				{strokes && (
					<div className="px-2">
						<input
							type="range"
							min="0"
							max={strokes}
							value={currentStroke}
							onChange={(e) => {
								setCurrentStroke(parseInt(e.target.value));
								setIsPlaying(false);
							}}
							className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
						/>
					</div>
				)}
			</div>
		</div>
	);
}

