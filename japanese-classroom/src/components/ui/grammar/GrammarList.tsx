"use client";

import { GrammarPoint } from "@/api/content-api";
import { Check } from "lucide-react";

interface GrammarListProps {
	grammarPoints: GrammarPoint[];
	currentIndex: number;
	completedIndices: Set<number>;
	onGrammarSelect: (index: number) => void;
}

export function GrammarList({
	grammarPoints,
	currentIndex,
	completedIndices,
	onGrammarSelect,
}: GrammarListProps) {
	return (
		<div className="space-y-2">
			{grammarPoints.map((grammarPoint, index) => {
				const isActive = index === currentIndex;
				const isCompleted = completedIndices.has(index);

				return (
					<button
						key={grammarPoint._id}
						onClick={() => onGrammarSelect(index)}
						className={`w-full p-4 rounded-lg text-left transition-all ${
							isActive
								? "bg-blue-100 border-2 border-blue-500"
								: isCompleted
								? "bg-white border-2 border-gray-200 hover:border-blue-300"
								: "bg-white border-2 border-gray-200 hover:border-gray-300"
						}`}
					>
						<div className="flex items-start justify-between gap-3">
							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-2 mb-1">
									<span className="text-sm font-medium text-gray-500">
										{index + 1}.
									</span>
									<div className="flex-1 min-w-0">
										<div className="font-medium text-gray-900 truncate">
											{grammarPoint.title}
										</div>
										<div className="text-xs text-gray-600 mt-1">
											{grammarPoint.pattern}
										</div>
									</div>
								</div>
							</div>
							<div>
								{isCompleted ? (
									<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
										<Check className="w-3 h-3 mr-1" />
										Completed
									</span>
								) : isActive ? (
									<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
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

