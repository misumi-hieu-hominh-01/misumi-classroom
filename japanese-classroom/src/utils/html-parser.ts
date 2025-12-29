import React, { ReactNode } from "react";

/**
 * Parse HTML string with ruby tags and render as React elements
 * Handles <ruby>, <rb>, <rt>, <rp>, and <br/> tags
 * Also handles newlines (\n) and normalizes <br> tags to <br/>
 *
 * @param html - HTML string containing ruby tags
 * @returns Array of ReactNode elements
 */
export function parseHtmlWithRuby(html: string): ReactNode[] {
  if (!html) return [];

  // 1. CHUẨN HÓA VÀ DỌN DẸP
  const normalized = html
    // Xóa bỏ các ký tự xuống dòng (văn bản thuần \n hoặc ký tự xuống dòng thực tế)
    .replace(/\\n|\n/g, "")
    // Xóa bỏ các thẻ đóng lỗi </br>
    .replace(/<\/br>/gi, "")
    // Chuẩn hóa tất cả các dạng <br>, <br > thành <br/> để làm mốc split
    .replace(/<br\s*\/?>/gi, "<br/>");

  // 2. TÁCH MẢNG (GIỮ LẠI THẺ TRONG MẢNG)
  // Regex này sẽ bắt chính xác <ruby>...</ruby> hoặc <br/>
  const parts = normalized.split(/(<ruby>[\s\S]*?<\/ruby>|<br\s*\/?>)/gi);

  let key = 0;
  return parts
    .map((part) => {
      if (!part || part.trim() === "") return null; // Loại bỏ các khoảng trắng thừa sau khi xóa \n

      // Xử lý thẻ Ruby
      if (part.startsWith("<ruby>")) {
        const rbMatch = part.match(/<rb>([\s\S]*?)<\/rb>/i);
        const rtMatch = part.match(/<rt>([\s\S]*?)<\/rt>/i);

        const rbContent = rbMatch
          ? rbMatch[1]
          : part.replace(/<ruby>|<rt>[\s\S]*?<\/rt>|<\/ruby>/gi, "").trim();
        const rtContent = rtMatch ? rtMatch[1] : "";

        return React.createElement(
          "ruby",
          { key: `ruby-${key++}` },
          rbContent,
          React.createElement("rt", null, rtContent)
        );
      }

      // Xử lý thẻ BR (Chỉ giữ lại những thẻ đã được chuẩn hóa thành <br/>)
      if (part.toLowerCase() === "<br/>") {
        return React.createElement("br", { key: `br-${key++}` });
      }

      // Xử lý Text thường
      return React.createElement("span", { key: `text-${key++}` }, part);
    })
    .filter(Boolean);
}
