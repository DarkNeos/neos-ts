import catalog from "./aiBots.json";

// 与 WindBot 的 bots.json 和对应 YDK 同步；来源版本记录在 JSON 中。
export const aiBots = catalog.bots;
export type AIBot = (typeof aiBots)[number];

export function getAIPassword(bot?: AIBot): string {
  if (!bot) return "AI";
  // 优先使用唯一的卡组标识，区分同名角色。超长标识改用角色名，
  // 为 YGOPro 房间密码的 20 个 UTF-16 码元保留一个结尾空字符。
  const identifier = bot.deck.length <= 16 ? bot.deck : bot.name;
  return `AI#${identifier}`;
}
