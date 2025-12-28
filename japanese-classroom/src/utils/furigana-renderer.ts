import React, { ReactNode } from "react";

/**
 * Renders a Japanese sentence with furigana only above kanji characters
 * This function compares sentence and reading to find parts that differ (furigana)
 *
 * @param sentence - Japanese sentence with kanji
 * @param rawReading - Reading (hiragana/katakana) that matches the sentence
 * @returns Array of ReactNode elements with ruby tags for furigana
 */
export function renderSentenceWithFurigana(
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
		return sentence.split("").map((ch, idx) =>
			React.createElement("span", { key: `plain-${idx}` }, ch)
		);
	}

	let rPos = 0;
	const pushContext = (ctx: string) => {
		for (const ch of ctx) {
			if (rPos < reading.length && reading[rPos] === ch) {
				rPos++;
			}
			nodes.push(
				React.createElement("span", { key: `ctx-${key++}` }, ch)
			);
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
			React.createElement(
				"ruby",
				{ key: `ruby-${key++}` },
				kanjiPart,
				React.createElement("rt", null, furigana)
			)
		);

		if (ctxAfter && ctxAfter.length > 0) {
			pushContext(ctxAfter);
		}
	}

	return nodes;
}

