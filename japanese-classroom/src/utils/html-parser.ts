import React, { ReactNode } from "react";

/**
 * Parse HTML string with ruby tags and render as React elements
 * Handles <ruby>, <rb>, <rt>, <rp>, and <br/> tags
 *
 * @param html - HTML string containing ruby tags
 * @returns Array of ReactNode elements
 */
export function parseHtmlWithRuby(html: string): ReactNode[] {
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
        nodes.push(React.createElement("span", { key: `text-${key++}` }, text));
      }
    }

    // Process match
    if (m.type === "ruby" && m.content) {
      // Parse ruby content - ignore <rp> tags
      const rbMatch = m.content.match(/<rb>([\s\S]*?)<\/rb>/);
      const rtMatch = m.content.match(/<rt>([\s\S]*?)<\/rt>/);

      if (rbMatch && rtMatch) {
        nodes.push(
          React.createElement(
            "ruby",
            { key: `ruby-${key++}` },
            rbMatch[1],
            React.createElement("rt", null, rtMatch[1])
          )
        );
      }
    } else if (m.type === "br") {
      nodes.push(React.createElement("br", { key: `br-${key++}` }));
    }

    pos = m.end;
  }

  // Add remaining text
  if (pos < html.length) {
    const text = html.slice(pos);
    if (text) {
      nodes.push(React.createElement("span", { key: `text-${key++}` }, text));
    }
  }

  return nodes.length > 0 ? nodes : [html];
}
