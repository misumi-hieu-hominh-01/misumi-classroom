'use client'

import { useState, useEffect } from 'react'
import { ContentTable } from './content-table'
import { BulkUploadPanel } from './bulk-upload-panel'
import { contentApi, type VocabItem, type KanjiItem, type GrammarPoint } from '../../api/content-api'

type ContentType = 'vocab' | 'kanji' | 'grammar'
type ContentItem = VocabItem | KanjiItem | GrammarPoint

interface ContentTabProps {
	type: ContentType
}

export function ContentTab({ type }: ContentTabProps) {
	const [items, setItems] = useState<ContentItem[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [showBulkUpload, setShowBulkUpload] = useState(false)
	const [page, setPage] = useState(1)
	const [total, setTotal] = useState(0)
	const [search, setSearch] = useState('')
	const [level, setLevel] = useState('')

	const loadItems = async () => {
		setIsLoading(true)
		try {
			let response
			if (type === 'vocab') {
				response = await contentApi.getVocabItems({ page, limit: 20, level: level || undefined, search: search || undefined })
			} else if (type === 'kanji') {
				response = await contentApi.getKanjiItems({ page, limit: 20, level: level || undefined, search: search || undefined })
			} else {
				response = await contentApi.getGrammarPoints({ page, limit: 20, level: level || undefined, search: search || undefined })
			}
			setItems(response.data)
			setTotal(response.total)
		} catch (error) {
			console.error('Error loading items:', error)
		} finally {
			setIsLoading(false)
		}
	}

	useEffect(() => {
		loadItems()
	}, [page, search, level, type])

	const handleDelete = async (id: string) => {
		try {
			if (type === 'vocab') {
				await contentApi.deleteVocabItem(id)
			} else if (type === 'kanji') {
				await contentApi.deleteKanjiItem(id)
			} else {
				await contentApi.deleteGrammarPoint(id)
			}
			await loadItems()
		} catch (error) {
			console.error('Error deleting item:', error)
			alert('Có lỗi xảy ra khi xóa')
		}
	}

	const handleBulkUpload = async (data: unknown[]) => {
		try {
			if (type === 'vocab') {
				await contentApi.bulkCreateVocabItems(data as Parameters<typeof contentApi.bulkCreateVocabItems>[0])
			} else if (type === 'kanji') {
				await contentApi.bulkCreateKanjiItems(data as Parameters<typeof contentApi.bulkCreateKanjiItems>[0])
			} else {
				await contentApi.bulkCreateGrammarPoints(data as Parameters<typeof contentApi.bulkCreateGrammarPoints>[0])
			}
			setShowBulkUpload(false)
			await loadItems()
		} catch (error) {
			console.error('Error bulk uploading:', error)
			throw error
		}
	}

	const getColumns = () => {
		if (type === 'vocab') {
			return [
				{ key: 'term', label: 'Từ' },
				{ key: 'reading', label: 'Cách đọc' },
				{
					key: 'meaningVi',
					label: 'Nghĩa',
					render: (value) => (Array.isArray(value) ? value.join(', ') : String(value)),
				},
				{ key: 'level', label: 'Cấp độ' },
				{ key: 'type', label: 'Loại' },
			]
		} else if (type === 'kanji') {
			return [
				{ key: 'kanji', label: 'Kanji' },
				{
					key: 'meaningVi',
					label: 'Nghĩa',
					render: (value) => (Array.isArray(value) ? value.join(', ') : String(value)),
				},
				{
					key: 'onyomi',
					label: 'Onyomi',
					render: (value) => (Array.isArray(value) ? value.join(', ') : value ? String(value) : '-'),
				},
				{
					key: 'kunyomi',
					label: 'Kunyomi',
					render: (value) => (Array.isArray(value) ? value.join(', ') : value ? String(value) : '-'),
				},
				{ key: 'level', label: 'Cấp độ' },
			]
		} else {
			return [
				{ key: 'title', label: 'Tiêu đề' },
				{ key: 'pattern', label: 'Mẫu câu' },
				{ key: 'explainVi', label: 'Giải thích' },
				{ key: 'level', label: 'Cấp độ' },
			]
		}
	}

	if (showBulkUpload) {
		return <BulkUploadPanel type={type} onUpload={handleBulkUpload} onCancel={() => setShowBulkUpload(false)} />
	}

	return (
		<div className="space-y-4">
			<div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
				<div className="flex flex-col sm:flex-row gap-2 flex-1">
					<input
						type="text"
						placeholder="Tìm kiếm..."
						value={search}
						onChange={(e) => {
							setSearch(e.target.value)
							setPage(1)
						}}
						className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4C4B0] placeholder:text-gray-600"
					/>
					<select
						value={level}
						onChange={(e) => {
							setLevel(e.target.value)
							setPage(1)
						}}
						className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4C4B0] text-gray-700"
					>
						<option value="">Tất cả cấp độ</option>
						<option value="N5">N5</option>
						<option value="N4">N4</option>
						<option value="N3">N3</option>
						<option value="N2">N2</option>
						<option value="N1">N1</option>
					</select>
				</div>
				<button
					onClick={() => setShowBulkUpload(true)}
					className="px-4 py-2 rounded-lg bg-[#D4C4B0] text-[#5C4A37] font-medium hover:bg-[#C9B8A3] transition-colors whitespace-nowrap"
				>
					Upload hàng loạt
				</button>
			</div>

			<ContentTable data={items} columns={getColumns()} onDelete={handleDelete} isLoading={isLoading} />

			{total > 0 && (
				<div className="flex items-center justify-between text-sm text-gray-600">
					<p>
						Hiển thị {(page - 1) * 20 + 1} - {Math.min(page * 20, total)} / {total}
					</p>
					<div className="flex gap-2">
						<button
							onClick={() => setPage((p) => Math.max(1, p - 1))}
							disabled={page === 1}
							className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
						>
							Trước
						</button>
						<button
							onClick={() => setPage((p) => p + 1)}
							disabled={page * 20 >= total}
							className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
						>
							Sau
						</button>
					</div>
				</div>
			)}
		</div>
	)
}




