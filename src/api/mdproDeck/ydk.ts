import type { YGOProDeckLike } from "ygopro-deck-encode";

/** 只替换卡片分区，保留 MDPro 的外观区段、注释及卡组和用户 ID。 */
export function updateCloudDeckYdk(
  original: string,
  deck: YGOProDeckLike,
): string {
  const sections = new Map([
    ["#main", deck.main],
    ["#extra", deck.extra],
    ["!side", deck.side],
  ]);
  const written = new Set<string>();
  const lines: string[] = [];
  let inCards = false;
  for (const line of original
    .replace(/\\r\\n|\\r|\\n/g, "\n")
    .split(/\r\n|\r|\n/)) {
    const marker = line.trim();
    const cards = sections.get(marker);
    if (cards) {
      inCards = true;
      if (!written.has(marker)) lines.push(line, ...cards.map(String));
      written.add(marker);
    } else {
      if (
        /^#(?:pickup|case|protector|field|grave|stand|mate)(?:\s|$)|^##/.test(
          marker,
        )
      )
        inCards = false;
      if (!inCards || !/^\d+$/.test(marker)) lines.push(line);
    }
  }
  for (const [marker, cards] of sections)
    if (!written.has(marker)) lines.push(marker, ...cards.map(String));
  return lines.join("\n");
}
