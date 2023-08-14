//! 禁限卡表

import { clear, createStore, get, setMany } from "idb-keyval";

import { useConfig } from "@/config";

const { lflistUrl } = useConfig();

type Forbiddens = Map<number, number>;

const IDB_NAME = "forbiddens";

// 禁限卡表的时间，比如 [2023.4] - 2023年4月表
export let forbiddenTime = "?";

const idb = createStore(IDB_NAME, IDB_NAME);

export async function initForbiddens(): Promise<void> {
  const text = await (await fetch(lflistUrl)).text();
  const { time, forbiddens } = extractForbiddensFromText(text);
  forbiddenTime = time;

  // 先清掉之前的记录
  clear(idb);
  // 设置新记录
  await setMany(Array.from(forbiddens));
}

// 获取禁限信息
export async function getForbiddenInfo(
  id: number,
): Promise<number | undefined> {
  return await get(id, idb);
}

// 解析函数，提取卡片编号和限制张数
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

// 分割文本为行，并提取每行的限制信息
function extractForbiddensFromText(text: string): {
  time: string;
  forbiddens: Forbiddens;
} {
  const lines = text.split("\n");
  const forbiddens = new Map<number, number>([]);

  // remove first line
  lines.shift();

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
