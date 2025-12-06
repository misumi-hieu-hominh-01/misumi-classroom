"use client";

import { X } from "lucide-react";

interface ConfirmDialogProps {
	visible: boolean;
	title: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
	onConfirm: () => void;
	onCancel: () => void;
}

export default function ConfirmDialog({
	visible,
	title,
	message,
	confirmText = "Xác nhận",
	cancelText = "Hủy",
	onConfirm,
	onCancel,
}: ConfirmDialogProps) {
	if (!visible) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-black/40 backdrop-blur-sm"
				onClick={onCancel}
			/>

			{/* Modal */}
			<div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-fade-in">
				{/* Header */}
				<div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white">
					<div className="flex items-center justify-between">
						<h2 className="text-2xl font-bold flex items-center gap-2">
							⚠️ {title}
						</h2>
						<button
							onClick={onCancel}
							className="p-2 hover:bg-white/20 rounded-full transition-colors"
						>
							<X size={24} />
						</button>
					</div>
				</div>

				{/* Content */}
				<div className="p-6">
					<p className="text-gray-700 text-lg mb-6">{message}</p>

					{/* Actions */}
					<div className="flex gap-3 justify-end">
						<button
							onClick={onCancel}
							className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
						>
							{cancelText}
						</button>
						<button
							onClick={onConfirm}
							className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
						>
							{confirmText}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

