"use client";

import { X } from "lucide-react";
import { KanjiStrokeOrder } from "./KanjiStrokeOrder";

interface KanjiHintModalProps {
	visible: boolean;
	kanji: string;
	strokes?: number;
	onRetry: () => void;
}

export function KanjiHintModal({
	visible,
	kanji,
	strokes,
	onRetry,
}: KanjiHintModalProps) {
	if (!visible) return null;

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
			<div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[72vh] flex flex-col overflow-hidden">
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
					<h2 className="text-2xl font-bold text-gray-900">Gợi ý nét vẽ</h2>
					<button
						onClick={onRetry}
						className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
					>
						<X className="w-6 h-6 text-gray-500" />
					</button>
				</div>

				{/* Content */}
				<div className="flex-1 overflow-y-auto p-4">
					<div className="h-72 w-full">
						<KanjiStrokeOrder
							kanji={kanji}
							strokes={strokes}
							hideKanjiText={true}
							hideResetButton={false}
						/>
					</div>
				</div>

				{/* Footer */}
				<div className="p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
					<button
						onClick={onRetry}
						className="w-full px-8 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold hover:from-blue-600 hover:to-blue-700 shadow-lg transition-all"
					>
						Thử lại
					</button>
				</div>
			</div>
		</div>
	);
}

