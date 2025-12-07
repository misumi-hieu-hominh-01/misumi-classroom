"use client";

import { KanjiItem } from "@/api/content-api";
import { Volume2 } from "lucide-react";
import { KanjiStrokeOrder } from "./KanjiStrokeOrder";

interface KanjiDisplayProps {
	kanji: KanjiItem;
}

export function KanjiDisplay({ kanji }: KanjiDisplayProps) {
	const handlePlayAudio = () => {
		// TODO: Implement audio playback
		console.log("Playing audio for:", kanji.kanji);
	};

	return (
		<div className="space-y-6">
			{/* Main Kanji Display */}
			<div className="text-center space-y-3">
				<div className="text-8xl font-bold text-gray-900">{kanji.kanji}</div>
				<div className="text-xl text-gray-600">
					{kanji.meaningVi.join("; ")}
				</div>
			</div>

			{/* Stroke Order Display */}
			<div className="flex justify-center">
				<div className="w-96 h-96 bg-gray-50 rounded-2xl border-2 border-gray-200 p-6">
					<KanjiStrokeOrder kanji={kanji.kanji} strokes={kanji.strokes} />
				</div>
			</div>

			{/* Readings Section */}
			<div className="grid grid-cols-2 gap-6">
				{/* Onyomi */}
				<div className="bg-blue-50 rounded-xl p-6">
					<h3 className="text-sm font-semibold text-gray-700 mb-3">
						Onyomi (Chinese Reading)
					</h3>
					{kanji.onyomi && kanji.onyomi.length > 0 ? (
						<div className="space-y-2">
							{kanji.onyomi.map((reading, index) => (
								<div
									key={index}
									className="text-2xl font-medium text-blue-900"
								>
									{reading}
								</div>
							))}
							{kanji.hanmean && kanji.hanmean.length > 0 && (
								<div className="mt-3 text-sm text-gray-600">
									漢: {kanji.hanmean.join(", ")}
								</div>
							)}
						</div>
					) : (
						<p className="text-gray-400 text-sm">No onyomi reading</p>
					)}
				</div>

				{/* Kunyomi */}
				<div className="bg-green-50 rounded-xl p-6">
					<h3 className="text-sm font-semibold text-gray-700 mb-3">
						Kunyomi (Japanese Reading)
					</h3>
					{kanji.kunyomi && kanji.kunyomi.length > 0 ? (
						<div className="space-y-2">
							{kanji.kunyomi.map((reading, index) => (
								<div
									key={index}
									className="text-2xl font-medium text-green-900"
								>
									{reading}
								</div>
							))}
						</div>
					) : (
						<p className="text-gray-400 text-sm">No kunyomi reading</p>
					)}
				</div>
			</div>

			{/* Example Words */}
			{((kanji.example_on && Object.keys(kanji.example_on).length > 0) ||
				(kanji.example_kun && Object.keys(kanji.example_kun).length > 0)) && (
				<div className="bg-white rounded-xl border-2 border-gray-200 p-6 space-y-4">
					<h3 className="text-lg font-semibold text-gray-900">
						Example Words
					</h3>
					
					{/* Onyomi Examples */}
					{kanji.example_on && Object.keys(kanji.example_on).length > 0 && (
						<div>
							<h4 className="text-sm font-semibold text-blue-700 mb-2">
								Onyomi Examples:
							</h4>
							<div className="space-y-2">
								{Object.entries(kanji.example_on).map(([reading, examples]) =>
									examples.map((example, idx) => (
										<div
											key={`${reading}-${idx}`}
											className="bg-blue-50 p-3 rounded-lg"
										>
											<div className="font-medium text-gray-900">
												{example.w} ({example.p})
											</div>
											<div className="text-sm text-gray-600 mt-1">
												{example.m}
											</div>
										</div>
									))
								)}
							</div>
						</div>
					)}

					{/* Kunyomi Examples */}
					{kanji.example_kun && Object.keys(kanji.example_kun).length > 0 && (
						<div>
							<h4 className="text-sm font-semibold text-green-700 mb-2">
								Kunyomi Examples:
							</h4>
							<div className="space-y-2">
								{Object.entries(kanji.example_kun).map(([reading, examples]) =>
									examples.map((example, idx) => (
										<div
											key={`${reading}-${idx}`}
											className="bg-green-50 p-3 rounded-lg"
										>
											<div className="font-medium text-gray-900">
												{example.w} ({example.p})
											</div>
											<div className="text-sm text-gray-600 mt-1">
												{example.m}
											</div>
										</div>
									))
								)}
							</div>
						</div>
					)}
				</div>
			)}

			{/* Tips */}
			{kanji.tips && kanji.tips.length > 0 && (
				<div className="bg-yellow-50 rounded-xl border-2 border-yellow-200 p-6">
					<h3 className="text-sm font-semibold text-gray-700 mb-3">
						💡 Learning Tips
					</h3>
					<div className="space-y-2">
						{kanji.tips.map((tip, index) => (
							<p key={index} className="text-gray-700">
								• {tip}
							</p>
						))}
					</div>
				</div>
			)}

			{/* Component Details */}
			{kanji.compDetail && kanji.compDetail.length > 0 && (
				<div className="bg-purple-50 rounded-xl border-2 border-purple-200 p-6">
					<h3 className="text-sm font-semibold text-gray-700 mb-3">
						📦 Components
					</h3>
					<div className="flex flex-wrap gap-3">
						{kanji.compDetail.map((comp, index) => (
							<div
								key={index}
								className="bg-white px-4 py-2 rounded-lg border border-purple-200"
							>
								<div className="text-2xl font-medium text-gray-900">
									{comp.w}
								</div>
								<div className="text-xs text-gray-600 mt-1">{comp.h}</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Play Audio Button */}
			<div className="flex justify-center">
				<button
					onClick={handlePlayAudio}
					className="flex flex-col items-center gap-2 px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors shadow-lg"
				>
					<Volume2 className="w-8 h-8" />
					<span className="text-sm font-medium">Play Audio</span>
				</button>
			</div>
		</div>
	);
}

