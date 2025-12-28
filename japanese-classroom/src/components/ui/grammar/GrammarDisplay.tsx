"use client";

import { GrammarPoint } from "@/api/content-api";
import { FileText } from "lucide-react";
import { parseHtmlWithRuby } from "@/utils/html-parser";

interface GrammarDisplayProps {
  grammar: GrammarPoint;
}

// CSS for proper ruby text (furigana) positioning
const rubyStyles = `
  ruby {
    ruby-position: over;
  }
  rt {
    font-size: 0.6em;
    opacity: 0.8;
  }
`;

export function GrammarDisplay({ grammar }: GrammarDisplayProps) {
  return (
    <>
      <style>{rubyStyles}</style>
      <div className="space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">{grammar.title}</h1>
          {grammar.pattern && (
            <div className="text-xl text-gray-600 bg-gray-100 px-4 py-2 rounded-lg inline-block">
              {parseHtmlWithRuby(grammar.pattern)}
            </div>
          )}
        </div>

        {/* Explanation */}
        <div className="bg-blue-50 rounded-xl p-6 border-l-4 border-blue-500">
          <div className="flex items-start gap-3">
            <FileText className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">
                Giải thích
              </h3>
              <p className="text-gray-800 leading-relaxed whitespace-pre-line">
                {parseHtmlWithRuby(grammar.explainVi)}
              </p>
            </div>
          </div>
        </div>

        {/* Examples */}
        {grammar.examples && grammar.examples.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">Ví dụ</h2>
            <div className="space-y-4">
              {grammar.examples.map((example, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">
                      {index + 1}
                    </div>
                    <div className="flex-1 space-y-2">
                      {/* Japanese Text */}
                      <div className="text-2xl font-medium text-gray-900">
                        {example.content}
                      </div>

                      {/* Transcription (Romaji) */}
                      {example.transcription && (
                        <div className="text-lg text-gray-600 italic">
                          ({example.transcription})
                        </div>
                      )}

                      {/* English Meaning */}
                      <div className="text-base text-gray-700 pt-2 border-t border-gray-200">
                        — {example.mean}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Type Badge */}
        {grammar.type && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">Loại:</span>
            <span className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium">
              {grammar.type}
            </span>
          </div>
        )}
      </div>
    </>
  );
}
