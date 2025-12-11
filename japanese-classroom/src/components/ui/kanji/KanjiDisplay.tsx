"use client";

import { KanjiItem } from "@/api/content-api";
import { KanjiStrokeOrder } from "./KanjiStrokeOrder";

interface KanjiDisplayProps {
  kanji: KanjiItem;
}

export function KanjiDisplay({ kanji }: KanjiDisplayProps) {
  return (
    <div className="space-y-6">
      {/* Top Section: Left (Kanji + Stroke Order) and Right (Information) */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left Side: Kanji Character and Stroke Order */}
        <div className="flex justify-center">
          <div className="w-full h-98">
            <KanjiStrokeOrder kanji={kanji.kanji} strokes={kanji.strokes} />
          </div>
        </div>

        {/* Right Side: Kanji Information */}
        <div className="space-y-6">
          {/* Hán Việt Reading - Moved to top */}
          {kanji.hanmean && kanji.hanmean.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Hán Việt (Chinese-Vietnamese Reading)
              </h3>
              <div className="space-y-2">
                {kanji.hanmean.map((reading, index) => (
                  <div
                    key={index}
                    className="text-2xl font-medium text-purple-900"
                  >
                    {reading}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Meaning */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Meaning
            </h3>
            <div className="text-xl text-gray-900">
              {kanji.meaningVi.join("; ")}
            </div>
          </div>

          {/* Onyomi */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Onyomi (Chinese Reading)
            </h3>
            {kanji.onyomi && kanji.onyomi.length > 0 ? (
              <div className="space-y-2">
                {kanji.onyomi.map((reading, index) => (
                  <div
                    key={index}
                    className="text-2xl font-medium text-blue-900"
                  >
                    {reading}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">No onyomi reading</p>
            )}
          </div>

          {/* Kunyomi */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Kunyomi (Japanese Reading)
            </h3>
            {kanji.kunyomi && kanji.kunyomi.length > 0 ? (
              <div className="space-y-2">
                {kanji.kunyomi.map((reading, index) => (
                  <div
                    key={index}
                    className="text-2xl font-medium text-green-900"
                  >
                    {reading}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">No kunyomi reading</p>
            )}
          </div>

          {/* Tips - Moved here, below Kunyomi */}
          {kanji.tips && kanji.tips.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                💡 Learning Tips
              </h3>
              <div className="space-y-2">
                {kanji.tips.map((tip, index) => (
                  <p key={index} className="text-gray-700">
                    • {tip}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Example Words - Full Width */}
      {((kanji.example_on && Object.keys(kanji.example_on).length > 0) ||
        (kanji.example_kun && Object.keys(kanji.example_kun).length > 0)) && (
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Example Words</h3>

          {/* Onyomi Examples */}
          {kanji.example_on && Object.keys(kanji.example_on).length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-blue-700 mb-2">
                Onyomi Examples:
              </h4>
              <div className="space-y-2">
                {Object.entries(kanji.example_on)
                  .flatMap(([reading, examples]) =>
                    examples.map((example, idx) => ({
                      example,
                      key: `${reading}-${idx}`,
                    }))
                  )
                  .slice(0, 5)
                  .map(({ example, key }) => (
                    <div key={key} className="bg-blue-50 p-3 rounded-lg">
                      <div className="font-medium text-gray-900">
                        {example.w} ({example.p})
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {example.m}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Kunyomi Examples */}
          {kanji.example_kun && Object.keys(kanji.example_kun).length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-green-700 mb-2">
                Kunyomi Examples:
              </h4>
              <div className="space-y-2">
                {Object.entries(kanji.example_kun)
                  .flatMap(([reading, examples]) =>
                    examples.map((example, idx) => ({
                      example,
                      key: `${reading}-${idx}`,
                    }))
                  )
                  .slice(0, 5)
                  .map(({ example, key }) => (
                    <div key={key} className="bg-green-50 p-3 rounded-lg">
                      <div className="font-medium text-gray-900">
                        {example.w} ({example.p})
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {example.m}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Component Details */}
      {kanji.compDetail && kanji.compDetail.length > 0 && (
        <div className="bg-purple-50 rounded-xl border-2 border-purple-200 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            📦 Components
          </h3>
          <div className="flex flex-wrap gap-3">
            {kanji.compDetail.map((comp, index) => (
              <div
                key={index}
                className="bg-white px-4 py-2 rounded-lg border border-purple-200"
              >
                <div className="text-2xl font-medium text-gray-900">
                  {comp.w}
                </div>
                <div className="text-xs text-gray-600 mt-1">{comp.h}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
