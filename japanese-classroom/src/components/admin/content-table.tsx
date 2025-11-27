'use client'

import { useState } from 'react'

interface ContentTableProps<T> {
	data: T[]
	columns: Array<{
		key: string
		label: string
		render?: (value: unknown, row: T) => React.ReactNode
	}>
	onEdit?: (item: T) => void
	onDelete?: (id: string) => void
	isLoading?: boolean
}

export function ContentTable<T extends { _id: string }>({
	data,
	columns,
	onEdit,
	onDelete,
	isLoading,
}: ContentTableProps<T>) {
	const [deletingId, setDeletingId] = useState<string | null>(null)

	const handleDelete = async (id: string) => {
		if (!confirm('Bạn có chắc chắn muốn xóa mục này?')) return

		setDeletingId(id)
		try {
			await onDelete?.(id)
		} finally {
			setDeletingId(null)
		}
	}

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5C4A37]"></div>
			</div>
		)
	}

	if (data.length === 0) {
		return (
			<div className="text-center py-12 text-gray-500">
				<p>Chưa có dữ liệu</p>
			</div>
		)
	}

	return (
		<div className="overflow-x-auto border border-gray-200 rounded-lg">
			<table className="min-w-full divide-y divide-gray-200">
				<thead className="bg-gray-50">
					<tr>
						{columns.map((col) => (
							<th
								key={col.key}
								className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
							>
								{col.label}
							</th>
						))}
						{(onEdit || onDelete) && (
							<th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
								Thao tác
							</th>
						)}
					</tr>
				</thead>
				<tbody className="bg-white divide-y divide-gray-200">
					{data.map((row) => (
						<tr key={row._id} className="hover:bg-gray-50">
							{columns.map((col) => (
								<td key={col.key} className="px-4 py-3 text-sm text-gray-900">
									{col.render
										? col.render((row as Record<string, unknown>)[col.key], row)
										: String((row as Record<string, unknown>)[col.key] || '-')}
								</td>
							))}
							{(onEdit || onDelete) && (
								<td className="px-4 py-3 text-sm space-x-2">
									{onEdit && (
										<button
											onClick={() => onEdit(row)}
											className="text-blue-600 hover:text-blue-800 font-medium"
										>
											Sửa
										</button>
									)}
									{onDelete && (
										<button
											onClick={() => handleDelete(row._id)}
											disabled={deletingId === row._id}
											className="text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
										>
											{deletingId === row._id ? 'Đang xóa...' : 'Xóa'}
										</button>
									)}
								</td>
							)}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	)
}












