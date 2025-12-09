"use client";

import { VocabItem } from "@/api/content-api";
import { Check } from "lucide-react";

interface WordListProps {
	words: VocabItem[];
	currentIndex: number;
	completedIndices: Set<number>;
	onWordSelect: (index: number) => void;
}

export function WordList({
	words,
	currentIndex,
	completedIndices,
	onWordSelect,
}: WordListProps) {
	return (
		<div className="space-y-1.5">
			{words.map((word, index) => {
				const isActive = index === currentIndex;
				const isCompleted = completedIndices.has(index);

				return (
					<button
						key={word._id}
						onClick={() => onWordSelect(index)}
						className={`w-full p-3 rounded-lg text-left transition-all ${
							isActive
								? "bg-blue-100 border-2 border-blue-500"
								: isCompleted
								? "bg-white border-2 border-gray-200 hover:border-blue-300"
								: "bg-white border-2 border-gray-200 hover:border-gray-300"
						}`}
					>
						<div className="flex items-start justify-between gap-2">
							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-2">
									<span className="text-xs font-medium text-gray-500">
										{index + 1}.
									</span>
									<div>
										<div className="text-sm font-medium text-gray-900">{word.term}</div>
										<div className="text-xs text-gray-600">{word.reading}</div>
									</div>
								</div>
							</div>
							<div>
								{isCompleted ? (
									<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
										<Check className="w-3 h-3 mr-1" />
										Completed
									</span>
								) : isActive ? (
									<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
										Active
									</span>
								) : null}
							</div>
						</div>
					</button>
				);
			})}
		</div>
	);
}

