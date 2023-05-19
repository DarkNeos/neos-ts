import { ygopro } from "@/api";
import { useConfig } from "@/config";
import { sleep } from "@/infra";
import { fetchEsHintMeta, matStore } from "@/stores";

export default async (chaining: ygopro.StocGameMessage.MsgChaining) => {
  fetchEsHintMeta({
    originMsg: "「[?]」被发动时",
    cardID: chaining.code,
  });

  matStore.setChaining(chaining.location, chaining.code, true);

  await sleep(useConfig().ui.chainingDelay);
  const location = chaining.location;

  // 恢复成非`chaining`状态
  matStore.setChaining(location, chaining.code, false);
  // 将`location`添加到连锁栈
  matStore.chains.push(location);
  // 设置被连锁状态
  matStore.setChained(location, true);
};
