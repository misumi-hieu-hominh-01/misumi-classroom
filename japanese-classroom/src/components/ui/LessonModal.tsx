'use client'

import { useState } from 'react'
import { X, Lock, Check, FileText } from 'lucide-react'
import { VocabularyLesson } from './vocab'
import { KanjiLesson } from './kanji'
import { GrammarLesson } from './grammar'

interface LessonModalProps {
	visible: boolean
	onClose: () => void
}

type LessonTab = 'vocabulary' | 'kanji' | 'grammar'

export function LessonModal({ visible, onClose }: LessonModalProps) {
	const [activeTab, setActiveTab] = useState<LessonTab>('vocabulary')
	const [vocabProgress, setVocabProgress] = useState(0)
	const [kanjiProgress, setKanjiProgress] = useState(0)
	
	// Unlock kanji when vocab is 100% complete
	const isKanjiUnlocked = vocabProgress >= 100
	// Unlock grammar when kanji is 100% complete
	const isGrammarUnlocked = kanjiProgress >= 100

	if (!visible) return null

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
			<div className="relative w-full max-w-6xl h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden">
			{/* Header */}
			<div className="flex items-center justify-between px-8 py-6 border-b border-gray-200">
				<h2 className="text-3xl font-bold text-gray-900">
					{activeTab === 'vocabulary' && 'Vocabulary Lesson'}
					{activeTab === 'kanji' && 'Kanji Lesson'}
					{activeTab === 'grammar' && 'Grammar Lesson'}
				</h2>
				<button
					onClick={onClose}
					className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
				>
					<X className="w-6 h-6 text-gray-600" />
				</button>
			</div>

			{/* Tabs */}
			<div className="flex items-center gap-2 px-8 py-4 bg-gray-50 border-b border-gray-200">
				<button
					onClick={() => setActiveTab('vocabulary')}
					className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
						activeTab === 'vocabulary'
							? 'bg-blue-500 text-white'
							: 'bg-white text-gray-700 hover:bg-gray-100'
					}`}
				>
					Vocabulary
					{vocabProgress >= 100 && (
						<Check className="w-4 h-4 text-green-500 bg-white rounded-full" />
					)}
				</button>
				<button
					onClick={() => isKanjiUnlocked && setActiveTab('kanji')}
					disabled={!isKanjiUnlocked}
					className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
						isKanjiUnlocked
							? activeTab === 'kanji'
								? 'bg-blue-500 text-white'
								: 'bg-white text-gray-700 hover:bg-gray-100'
							: 'bg-gray-200 text-gray-400 cursor-not-allowed'
					}`}
				>
					字 Kanji
					{isKanjiUnlocked && kanjiProgress >= 100 && (
						<Check className="w-4 h-4 text-green-500 bg-white rounded-full" />
					)}
					{!isKanjiUnlocked && <Lock className="w-4 h-4" />}
				</button>
				<button
					onClick={() => isGrammarUnlocked && setActiveTab('grammar')}
					disabled={!isGrammarUnlocked}
					className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
						isGrammarUnlocked
							? activeTab === 'grammar'
								? 'bg-blue-500 text-white'
								: 'bg-white text-gray-700 hover:bg-gray-100'
							: 'bg-gray-200 text-gray-400 cursor-not-allowed'
					}`}
				>
					Grammar
					{isGrammarUnlocked && <FileText className="w-4 h-4" />}
					{!isGrammarUnlocked && <Lock className="w-4 h-4" />}
				</button>
			</div>

			{/* Content */}
			<div className="h-[calc(100%-180px)] overflow-hidden">
				{activeTab === 'vocabulary' && (
					<VocabularyLesson onProgressChange={setVocabProgress} />
				)}
				{activeTab === 'kanji' && (
					isKanjiUnlocked ? (
						<KanjiLesson onProgressChange={setKanjiProgress} />
					) : (
						<div className="flex items-center justify-center h-full text-gray-400">
							<div className="text-center">
								<Lock className="w-16 h-16 mx-auto mb-4" />
								<p className="text-xl mb-2">Complete Vocabulary to unlock Kanji</p>
								<p className="text-sm">Progress: {Math.round(vocabProgress)}%</p>
							</div>
						</div>
					)
				)}
				{activeTab === 'grammar' && (
					isGrammarUnlocked ? (
						<GrammarLesson />
					) : (
						<div className="flex items-center justify-center h-full text-gray-400">
							<div className="text-center">
								<Lock className="w-16 h-16 mx-auto mb-4" />
								<p className="text-xl mb-2">Complete Kanji to unlock Grammar</p>
								<p className="text-sm">Progress: {Math.round(kanjiProgress)}%</p>
							</div>
						</div>
					)
				)}
			</div>
			</div>
		</div>
	)
}

