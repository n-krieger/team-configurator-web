import type { Position } from './types';

export interface ParsedLine {
  name: string;
  /** Position id, or undefined when the line names none. */
  position?: string;
  strength?: number;
}

/**
 * Parses pasted lines like "Anna", "Anna G 1.2", "Ben, Defender, 0,9" or the
 * old YAML format "- P1 S 1.1". A position matches by label, id or the
 * first letter of the label.
 */
export function parseTextList(text: string, positions: Position[]): ParsedLine[] {
  const match = (token: string): string | undefined => {
    const t = token.toLowerCase();
    return (
      positions.find((p) => p.label.toLowerCase() === t)?.id ??
      positions.find((p) => p.id.toLowerCase() === t)?.id ??
      (t.length === 1 ? positions.find((p) => p.label.toLowerCase().startsWith(t))?.id : undefined)
    );
  };
  const out: ParsedLine[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/^\s*[-*•]\s+/, '').trim();
    if (!line) continue;
    const separated = /[;\t]/.test(line) || (line.includes(',') && !/\d,\d/.test(line));
    let tokens = separated
      ? line.split(/[;\t]|,(?!\d)/).map((t) => t.trim()).filter(Boolean)
      : line.split(/\s+/);
    const parsed: ParsedLine = { name: '' };
    const last = tokens[tokens.length - 1];
    if (tokens.length > 1 && /^\d+([.,]\d+)?$/.test(last)) {
      parsed.strength = Number(last.replace(',', '.'));
      tokens = tokens.slice(0, -1);
    }
    if (tokens.length > 1) {
      const position = match(tokens[tokens.length - 1]);
      if (position) {
        parsed.position = position;
        tokens = tokens.slice(0, -1);
      }
    }
    parsed.name = tokens.join(' ');
    if (parsed.name) out.push(parsed);
  }
  return out;
}
