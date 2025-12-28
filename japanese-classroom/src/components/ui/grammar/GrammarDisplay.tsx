"use client";

import { useState } from "react";
import { GrammarPoint } from "@/api/content-api";
import { parseHtmlWithRuby } from "@/utils/html-parser";
import { parseGrammarTitle } from "@/utils/grammar-parser";
import { renderSentenceWithFurigana } from "@/utils/furigana-renderer";

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
  const { pattern: titlePattern, meaning: titleMeaning } = parseGrammarTitle(
    grammar.title
  );
  const [openedIndex, setOpenedIndex] = useState<number | null>(null);

  function handleExampleClick(index: number) {
    if (openedIndex === index) {
      setOpenedIndex(null);
    } else {
      setOpenedIndex(index);
    }
  }

  return (
    <>
      <style>{rubyStyles}</style>
      <div className="space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <div className="space-y-2 text-center mb-4">
            {titlePattern && (
              <h1 className="text-4xl font-bold text-gray-900">
                {titlePattern}
              </h1>
            )}
            {titleMeaning && (
              <p className="text-xl text-gray-600">{titleMeaning}</p>
            )}
          </div>
          {grammar.pattern && (
            <div className="text-xl text-gray-600 bg-gray-100 px-6 py-4 rounded-lg inline-block">
              {parseHtmlWithRuby(grammar.pattern)}
            </div>
          )}
        </div>

        {/* Explanation */}
        <div className="bg-blue-50 rounded-xl p-6 border-l-4 border-blue-500">
          <div className="flex items-start gap-3">
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
            <div className="space-y-4" style={{ perspective: "1000px" }}>
              {grammar.examples.map((example, index) => {
                const isOpen = openedIndex === index;

                return (
                  <div
                    key={index}
                    className="relative bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-blue-300 cursor-pointer"
                    onClick={() => handleExampleClick(index)}
                    style={{
                      transformStyle: "preserve-3d",
                      transform: isOpen ? "rotateX(180deg)" : "rotateX(0deg)",
                      transformOrigin: "center center",
                      transition: "transform 0.6s ease-in-out",
                    }}
                  >
                    {/* Front side - Japanese text */}
                    <div
                      className="flex items-start gap-4"
                      style={{
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                      }}
                    >
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="text-2xl font-medium text-gray-900">
                          {example.transcription
                            ? renderSentenceWithFurigana(
                                example.content,
                                example.transcription
                              )
                            : example.content}
                        </div>
                      </div>
                    </div>

                    {/* Back side - Vietnamese meaning */}
                    <div
                      className="absolute inset-0 flex items-center justify-center p-6 rounded-xl"
                      style={{
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                        transform: "rotateX(180deg)",
                        backgroundColor: "#f3f4f6",
                      }}
                    >
                      <div className="text-xl font-medium text-gray-800 text-center leading-relaxed">
                        {example.mean}
                      </div>
                    </div>
                  </div>
                );
              })}
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
