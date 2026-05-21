export type ParseConfidence = "high" | "medium" | "low";

export interface ParsedIdentity {
  rawText: string;
  ownerName: string | null;
  petName: string | null;
  confidence: ParseConfidence;
}

// 区切り文字パターン(高確信度)
const DELIMITER_RE = /^(.+?)\s*[/／・]\s*(.+)$/;
// スペース区切りパターン(中確信度): 姓 名 / 姓名 ペット名 など
// 2〜4文字の2トークンに限定してノイズを抑える
const SPACE_RE = /^(\S{1,8})\s+(\S{1,8})$/;

export function parseIdentityMessage(text: string): ParsedIdentity | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  // 1. 区切り文字パターン(/ ／ ・)
  const delimMatch = trimmed.match(DELIMITER_RE);
  if (delimMatch) {
    const [, a, b] = delimMatch;
    return {
      rawText: trimmed,
      ownerName: a.trim(),
      petName: b.trim(),
      confidence: "high",
    };
  }

  // 2. スペース区切りパターン
  const spaceMatch = trimmed.match(SPACE_RE);
  if (spaceMatch) {
    const [, a, b] = spaceMatch;
    return {
      rawText: trimmed,
      ownerName: a.trim(),
      petName: b.trim(),
      confidence: "medium",
    };
  }

  return null;
}
