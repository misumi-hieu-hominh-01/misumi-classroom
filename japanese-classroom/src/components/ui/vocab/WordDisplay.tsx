"use client";

import { ReactNode } from "react";
import { VocabItem } from "@/api/content-api";
import { Volume2, ImageIcon } from "lucide-react";
import { SafeImage } from "../SafeImage";

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

interface WordDisplayProps {
  word: VocabItem;
}

/**
 * Renders a Japanese sentence with furigana only above kanji characters
 * This function compares sentence and reading to find parts that differ (furigana)
 */
function renderSentenceWithFurigana(
  sentence: string,
  rawReading: string
): ReactNode[] {
  const nodes: ReactNode[] = [];
  let key = 0;

  // 1) Chuẩn hoá reading: bỏ hết space (half & full width)
  const reading = rawReading.replace(/[\s\u3000]+/g, "");

  const kanjiRegex = /[\u4e00-\u9faf]/;

  type Block = { start: number; end: number };
  const blocks: Block[] = [];
  let i = 0;

  while (i < sentence.length) {
    if (kanjiRegex.test(sentence[i])) {
      const start = i;
      while (i < sentence.length && kanjiRegex.test(sentence[i])) {
        i++;
      }
      blocks.push({ start, end: i });
    } else {
      i++;
    }
  }

  // 3) Tạo các "context" giữa các block
  const contexts: string[] = [];
  let prevEnd = 0;
  for (const b of blocks) {
    contexts.push(sentence.slice(prevEnd, b.start));
    prevEnd = b.end;
  }
  contexts.push(sentence.slice(prevEnd));

  if (blocks.length === 0) {
    return sentence
      .split("")
      .map((ch, idx) => <span key={`plain-${idx}`}>{ch}</span>);
  }

  let rPos = 0;
  const pushContext = (ctx: string) => {
    for (const ch of ctx) {
      if (rPos < reading.length && reading[rPos] === ch) {
        rPos++;
      }
      nodes.push(<span key={`ctx-${key++}`}>{ch}</span>);
    }
  };

  // 4) Context trước block đầu tiên
  if (contexts[0]) {
    pushContext(contexts[0]);
  }

  // 5) Mỗi block kanji
  for (let idx = 0; idx < blocks.length; idx++) {
    const { start, end } = blocks[idx];
    const kanjiPart = sentence.slice(start, end);
    const ctxAfter = contexts[idx + 1] ?? "";

    let furigana = "";

    if (ctxAfter && ctxAfter.length > 0) {
      // ⚠️ Quan trọng: phải có ít nhất 1 ký tự furigana cho block kanji
      const searchFrom = Math.min(rPos + 1, reading.length);
      const nextIndex = reading.indexOf(ctxAfter, searchFrom);

      if (nextIndex === -1) {
        // Không tìm được ctxAfter nữa → phần còn lại là furigana
        furigana = reading.slice(rPos);
        rPos = reading.length;
      } else {
        furigana = reading.slice(rPos, nextIndex);
        rPos = nextIndex;
      }
    } else {
      // Không có context sau (ví dụ câu kết thúc ngay sau block)
      furigana = reading.slice(rPos);
      rPos = reading.length;
    }

    nodes.push(
      <ruby key={`ruby-${key++}`}>
        {kanjiPart}
        <rt>{furigana}</rt>
      </ruby>
    );

    if (ctxAfter && ctxAfter.length > 0) {
      pushContext(ctxAfter);
    }
  }

  return nodes;
}

export function WordDisplay({ word }: WordDisplayProps) {
  const handlePlayAudio = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      // Create a new speech synthesis utterance
      const utterance = new SpeechSynthesisUtterance(word.term);

      // Set language to Japanese
      utterance.lang = "ja-JP";

      // Set speech rate and pitch
      utterance.rate = 0.9;
      utterance.pitch = 1;

      // Speak the word
      window.speechSynthesis.speak(utterance);
    }
  };

  const handlePlayExampleAudio = (sentence: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      // Create a new speech synthesis utterance
      const utterance = new SpeechSynthesisUtterance(sentence);

      // Set language to Japanese
      utterance.lang = "ja-JP";

      // Set speech rate and pitch
      utterance.rate = 0.9;
      utterance.pitch = 1;

      // Speak the sentence
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <>
      <style>{rubyStyles}</style>
      <div className="space-y-5">
        {/* Main Word Display */}
        <div className="relative text-center space-y-2">
          {/* Play Audio Button - Top Right */}
          <button
            onClick={handlePlayAudio}
            className="absolute top-0 right-0 p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors shadow-lg"
            aria-label="Play audio"
          >
            <Volume2 className="w-5 h-5" />
          </button>
          <div className="text-5xl font-bold text-gray-900">{word.term}</div>
          <div className="text-2xl text-gray-600">{word.reading}</div>
        </div>

        {/* Image Display */}
        <div className="flex justify-center">
          <div className="w-64 h-64 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden border-2 border-gray-200">
            {word.imageUrl ? (
              <SafeImage
                src={word.imageUrl}
                alt={word.term}
                fill
                objectFit="cover"
                className="w-full h-full"
              />
            ) : (
              <div className="text-center text-gray-400">
                <ImageIcon className="w-16 h-16 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No image available</p>
              </div>
            )}
          </div>
        </div>

        {/* Meaning Display */}
        <div className="text-center space-y-2">
          <div className="text-2xl font-semibold text-gray-900">
            {word.meaningVi.join(", ")}
          </div>
          {word.type && (
            <div className="inline-block px-3 py-1.5 bg-gray-100 rounded-lg">
              <span className="text-xs font-medium text-gray-600">
                {word.type}
              </span>
            </div>
          )}
        </div>

        {/* Additional Information */}
        {(word.examples || word.synonyms || word.antonyms) && (
          <div className="space-y-4 pt-4 border-t border-gray-200">
            {/* Examples */}
            {word.examples && word.examples.length > 0 && (
              <div className="space-y-3">
                {word.examples.map((example, index) => (
                  <div
                    key={index}
                    className="relative bg-gray-50 rounded-lg p-4 border border-gray-200"
                  >
                    {/* Audio Button - Top Right */}
                    <button
                      onClick={() => handlePlayExampleAudio(example.sentence)}
                      className="absolute top-2 right-2 p-1.5 bg-gray-200 hover:bg-gray-300 text-gray-600 rounded-full transition-colors"
                      aria-label="Play example audio"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>

                    {/* Sentence with Furigana - Large bold text */}
                    <div className="text-lg font-bold mb-2 leading-relaxed text-gray-900">
                      {renderSentenceWithFurigana(
                        example.sentence,
                        example.reading
                      )}
                    </div>

                    {/* Meaning - Small text below */}
                    <div className="text-sm text-gray-600">
                      {example.meaning}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {word.synonyms && word.synonyms.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-700 mb-1.5">
                  Synonyms:
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {word.synonyms.map((synonym, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs"
                    >
                      {synonym}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {word.antonyms && word.antonyms.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-700 mb-1.5">
                  Antonyms:
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {word.antonyms.map((antonym, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-red-50 text-red-700 rounded-full text-xs"
                    >
                      {antonym}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
