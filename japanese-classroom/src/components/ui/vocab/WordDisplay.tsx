"use client";

import { VocabItem } from "@/api/content-api";
import { Volume2, ImageIcon } from "lucide-react";
import { SafeImage } from "../SafeImage";

interface WordDisplayProps {
	word: VocabItem;
}

export function WordDisplay({ word }: WordDisplayProps) {
	const handlePlayAudio = () => {
		// TODO: Implement audio playback
		console.log("Playing audio for:", word.term);
	};

	return (
		<div className="space-y-8">
			{/* Main Word Display */}
			<div className="text-center space-y-4">
				<div className="text-7xl font-bold text-gray-900">{word.term}</div>
				<div className="text-3xl text-gray-600">{word.reading}</div>
			</div>

			{/* Image Display */}
			<div className="flex justify-center">
				<div className="w-80 h-80 bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-gray-200">
					{word.imageUrl ? (
						<SafeImage
							src={word.imageUrl}
							alt={word.term}
							fill
							objectFit="cover"
							className="w-full h-full"
						/>
					) : (
						<div className="text-center text-gray-400">
							<ImageIcon className="w-24 h-24 mx-auto mb-4 opacity-50" />
							<p className="text-lg">No image available</p>
						</div>
					)}
				</div>
			</div>

			{/* Meaning Display */}
			<div className="text-center space-y-3">
				<div className="text-4xl font-semibold text-gray-900">
					{word.meaningVi.join(", ")}
				</div>
				{word.type && (
					<div className="inline-block px-4 py-2 bg-gray-100 rounded-lg">
						<span className="text-sm font-medium text-gray-600">
							{word.type}
						</span>
					</div>
				)}
			</div>

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

			{/* Additional Information */}
			{(word.synonyms || word.antonyms) && (
				<div className="space-y-4 pt-6 border-t border-gray-200">
					{word.synonyms && word.synonyms.length > 0 && (
						<div>
							<h4 className="text-sm font-semibold text-gray-700 mb-2">
								Synonyms:
							</h4>
							<div className="flex flex-wrap gap-2">
								{word.synonyms.map((synonym, index) => (
									<span
										key={index}
										className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
									>
										{synonym}
									</span>
								))}
							</div>
						</div>
					)}
					{word.antonyms && word.antonyms.length > 0 && (
						<div>
							<h4 className="text-sm font-semibold text-gray-700 mb-2">
								Antonyms:
							</h4>
							<div className="flex flex-wrap gap-2">
								{word.antonyms.map((antonym, index) => (
									<span
										key={index}
										className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm"
									>
										{antonym}
									</span>
								))}
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

