import { ygopro } from "@/api";
import { useConfig } from "@/config";
import { sleep } from "@/infra";
import { cardStore, fetchEsHintMeta, matStore } from "@/stores";

export default async (chaining: ygopro.StocGameMessage.MsgChaining) => {
  fetchEsHintMeta({
    originMsg: "「[?]」被发动时",
    cardID: chaining.code,
  });

  await cardStore.setChaining(chaining.location, chaining.code, true);

  await sleep(useConfig().ui.chainingDelay);
  const location = chaining.location;

  // 恢复成非`chaining`状态
  await cardStore.setChaining(location, chaining.code, false);
  // 将`location`添加到连锁栈
  matStore.chains.push(location);
  // 设置被连锁状态
  const target = cardStore.find(location);
  if (target) {
    target.chainIndex = matStore.chains.length;
    eventBus.emit(Report.Chaining, target.uuid);
  } else {
    console.warn(`<Chaining>target from ${location} is null`);
  }
};
