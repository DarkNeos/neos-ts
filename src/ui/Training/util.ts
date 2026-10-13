import { useConfig } from "@/config";
import { normalizeWebSocketAddress } from "@/infra";
import {
  accountStore,
  type TrainingOptions,
  type TrainingSession,
} from "@/stores";
import { deckDraftStore } from "@/stores/deckDraftStore";
import { connectSrvpro } from "@/ui/Match/util";

const trainingServer = useConfig().servers.find(
  (server) => server.name === "pre-release",
)!;

/** 使用超先行服训练，首次默认先攻且保留卡组顺序。 */
export const defaultTrainingOptions: TrainingOptions = {
  server: `${trainingServer.ip}:${trainingServer.port}`,
  first: true,
  noShuffle: true,
  handSize: 5,
};

const SETTINGS_KEY = "neos.training.options";
export const MIN_TRAINING_HAND_SIZE = 1;
// 不洗牌、固定猜拳及指定 Rainbow 的参数受房间密码 20 字符上限约束。
export const MAX_TRAINING_HAND_SIZE = 9;

/** 表单和旧版存储共用校验，拒绝空值、小数及协议无法表示的数量。 */
export function isTrainingHandSize(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= MIN_TRAINING_HAND_SIZE &&
    value <= MAX_TRAINING_HAND_SIZE
  );
}

/** 按字段恢复配置，旧设置缺少起手数量时使用默认的五张。 */
export function readTrainingOptions(): TrainingOptions {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
    return {
      // 服务器由项目配置统一指定，旧版保存的地址不覆盖当前训练服。
      server: defaultTrainingOptions.server,
      first: typeof saved?.first === "boolean" ? saved.first : true,
      noShuffle: typeof saved?.noShuffle === "boolean" ? saved.noShuffle : true,
      handSize: isTrainingHandSize(saved?.handSize)
        ? saved.handSize
        : defaultTrainingOptions.handSize,
    };
  } catch {
    return { ...defaultTrainingOptions };
  }
}

/** 只保存可复用的开局选项，编辑中的卡组仍由编辑器持有。 */
export function saveTrainingOptions(options: TrainingOptions) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(options));
  } catch {
    // 本地存储不可用时仍可开始训练。
  }
}

/** 把训练规则编码为 srvpro2 房间密码；ST 指定起手数量，NS 禁止洗牌。 */
export function getTrainingPassword(noShuffle: boolean, handSize: number) {
  if (!isTrainingHandSize(handSize)) {
    throw new Error("起手手牌数量必须是 1–9 的整数");
  }
  // SS 固定 AI 出剪刀，NC 允许使用尚未完成的卡组。
  // 使用 Rainbow 的中文名称，保证完整参数不超过 20 个字符。
  return `AI,SS,NC${noShuffle ? ",NS" : ""},ST${handSize}#梦前菜菜`;
}

/** 校验当前卡组后连接训练房间，成功时标记返回编辑器应保留未保存内容。 */
export async function startTraining(
  session: TrainingSession,
): Promise<boolean> {
  const server = normalizeWebSocketAddress(session.server);
  const passWd = getTrainingPassword(session.noShuffle, session.handSize);
  if (!session.deck.main.length) {
    throw new Error("请先在主卡组中加入卡片");
  }
  if (
    session.deck.main.length > 60 ||
    session.deck.extra.length > 15 ||
    session.deck.side.length > 15
  ) {
    throw new Error(
      "训练卡组最多包含 60 张主卡组、15 张额外卡组和 15 张副卡组卡片",
    );
  }
  if (session.handSize > session.deck.main.length) {
    throw new Error("起手手牌数量不能超过主卡组的卡片数量");
  }
  const connected = await connectSrvpro({
    ip: server,
    player: accountStore.user?.username ?? "Guest",
    passWd,
    training: { ...session, server },
  });
  if (connected) deckDraftStore.suspend();
  return connected;
}
