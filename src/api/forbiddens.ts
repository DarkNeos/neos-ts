import { isNil } from "lodash-es";

import { useConfig } from "@/config";

import { CardMeta } from "./cards";
const { lflistUrl } = useConfig();

class Forbidden {
  private data: Map<number, number> = new Map<number, number>();
  public time: string = "?";

  public async init(): Promise<void> {
    const text = await (await fetch(lflistUrl)).text();
    const { time, forbiddens } = this.extractForbiddensFromText(text);
    this.time = time;
    this.setForbiddens(forbiddens);
  }

  public set(cardId: number, limitCount: number): void {
    this.data.set(cardId, limitCount);
  }

  public get(card: CardMeta): number | undefined {
    let cardForbiddenById = this.data.get(card.id);
    if (isNil(cardForbiddenById) && !isNil(card.data.alias)) {
      cardForbiddenById = this.data.get(card.data.alias);
    }
    return cardForbiddenById;
  }

  private setForbiddens(forbiddens: Map<number, number>): void {
    this.data.clear();
    for (const [cardId, limitCount] of forbiddens) {
      this.data.set(cardId, limitCount);
    }
  }

  private extractForbiddensFromText(text: string): {
    time: string;
    forbiddens: Map<number, number>;
  } {
    // 解析文本行中的卡片信息
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
    let time = "?";

    // 移除第一行标题
    lines.shift();

    for (const line of lines) {
      if (line.startsWith("#")) {
        // 忽略注释行
      } else if (line.startsWith("!")) {
        // 如果时间已经设置，退出循环
        if (time !== "?") {
          break;
        } else {
          // 提取时间信息
          time = line.substring(1).trim();
        }
      } else {
        const cardInfo = parseCardInfo(line);
        if (cardInfo) {
          // 将卡片信息添加到禁限表
          forbiddens.set(cardInfo.cardId, cardInfo.limitCount);
        }
      }
    }

    // 返回时间和禁限表
    return { time, forbiddens };
  }
}

export const forbidden = new Forbidden();
