import { useConfig } from "@/config";

const { lflistUrl } = useConfig();

type Forbiddens = Map<number, number>;

export let forbiddenTime = "?";

export async function initForbiddens(): Promise<void> {
  const text = await (await fetch(lflistUrl)).text();
  const { time, forbiddens } = extractForbiddensFromText(text);
  forbiddenTime = time;
  setForbiddens(forbiddens);
}

const forbiddensMap: Forbiddens = new Map<number, number>();

function setForbiddens(forbiddens: Forbiddens): void {
  forbiddensMap.clear();
  for (const [cardId, limitCount] of forbiddens) {
    forbiddensMap.set(cardId, limitCount);
  }
}

export function getForbiddenInfo(id: number): number | undefined {
  return forbiddensMap.get(id);
}

function extractForbiddensFromText(text: string): {
  time: string;
  forbiddens: Forbiddens;
} {
  function parseCardInfo(
    input: string,
  ): { cardId: number; limitCount: number } | null {
    const match = input.match(/^(\d+)\s+(\d+)\s+--/);
    if (match) {
      const cardId = parseInt(match[1]);
      const limitCount = parseInt(match[2]);
      return { cardId, limitCount };
    }
    return null;
  }
  const lines = text.split("\n");
  const forbiddens = new Map<number, number>();

  lines.shift(); // remove first line

  let time = "?";

  for (const line of lines) {
    if (line.startsWith("#")) {
      // do nothing
    } else if (line.startsWith("!")) {
      if (time !== "?") {
        // 已经读取完第一个禁限表的信息了，退出循环
        break;
      } else {
        time = line.substring(1).trim();
      }
    } else {
      const cardInfo = parseCardInfo(line);
      if (cardInfo) {
        forbiddens.set(cardInfo.cardId, cardInfo.limitCount);
      }
    }
  }

  return { time, forbiddens };
}
