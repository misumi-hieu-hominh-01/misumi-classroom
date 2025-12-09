"use client";

import { ReactNode } from "react";
import { GrammarPoint } from "@/api/content-api";
import { FileText } from "lucide-react";

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

/**
 * Parse HTML string with ruby tags and render as React elements
 * Handles <ruby>, <rb>, <rt>, <rp>, and <br/> tags
 */
function parseHtmlWithRuby(html: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let key = 0;
  let pos = 0;

  // Find all ruby tags and other HTML tags
  const rubyRegex = /<ruby>([\s\S]*?)<\/ruby>/g;
  const brRegex = /<br\s*\/?>/gi;

  // Collect all matches with positions
  const matches: Array<{
    type: "ruby" | "br" | "text";
    start: number;
    end: number;
    content?: string;
  }> = [];

  let match;

  // Find ruby tags
  while ((match = rubyRegex.exec(html)) !== null) {
    matches.push({
      type: "ruby",
      start: match.index,
      end: match.index + match[0].length,
      content: match[1],
    });
  }

  // Find br tags
  rubyRegex.lastIndex = 0; // Reset
  while ((match = brRegex.exec(html)) !== null) {
    matches.push({
      type: "br",
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  // Sort by position
  matches.sort((a, b) => a.start - b.start);

  // Process matches
  for (const m of matches) {
    // Add text before match
    if (m.start > pos) {
      const text = html.slice(pos, m.start);
      if (text) {
        nodes.push(<span key={`text-${key++}`}>{text}</span>);
      }
    }

    // Process match
    if (m.type === "ruby" && m.content) {
      // Parse ruby content - ignore <rp> tags
      const rbMatch = m.content.match(/<rb>([\s\S]*?)<\/rb>/);
      const rtMatch = m.content.match(/<rt>([\s\S]*?)<\/rt>/);

      if (rbMatch && rtMatch) {
        nodes.push(
          <ruby key={`ruby-${key++}`}>
            {rbMatch[1]}
            <rt>{rtMatch[1]}</rt>
          </ruby>
        );
      }
    } else if (m.type === "br") {
      nodes.push(<br key={`br-${key++}`} />);
    }

    pos = m.end;
  }

  // Add remaining text
  if (pos < html.length) {
    const text = html.slice(pos);
    if (text) {
      nodes.push(<span key={`text-${key++}`}>{text}</span>);
    }
  }

  return nodes.length > 0 ? nodes : [html];
}

export function GrammarDisplay({ grammar }: GrammarDisplayProps) {
  return (
    <>
      <style>{rubyStyles}</style>
      <div className="space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">{grammar.title}</h1>
          {grammar.pattern && (
            <div className="text-xl text-gray-600 font-mono bg-gray-100 px-4 py-2 rounded-lg inline-block">
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
                Explanation
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
            <h2 className="text-2xl font-semibold text-gray-900">Examples</h2>
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
            <span className="text-sm font-medium text-gray-600">Type:</span>
            <span className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium">
              {grammar.type}
            </span>
          </div>
        )}
      </div>
    </>
  );
}
