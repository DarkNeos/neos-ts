import { fetchCard, ygopro } from "@/api";
import { cardStore, fetchEsHintMeta } from "@/stores";
import { eventbus, Task } from "@/infra";

let cnt = 0;

export default async (draw: ygopro.StocGameMessage.MsgDraw) => {
  fetchEsHintMeta({ originMsg: "玩家抽卡时" });

  const drawLength = draw.cards.length;

  // 将卡从卡组移到手牌：设置zone、occupant、sequence
  const handsLength = cardStore.at(ygopro.CardZone.HAND, draw.player).length;
  const newHands = cardStore
    .at(ygopro.CardZone.DECK, draw.player)
    .slice(-drawLength);

  for (const idx in newHands) {
    const card = newHands[Number(idx)];
    const code = draw.cards[idx];
    const meta = await fetchCard(code);
    card.code = code;
    card.meta = meta;
    card.zone = ygopro.CardZone.HAND;
    card.sequence = Number(idx) + handsLength;
  }

  if (cnt++ < 2) {
    // FIXME 暂时性的解决方案，头两回抽卡（双方各自初始手卡）先屏蔽掉
    // 不然会出现一些问题...
    return;
  }
  // 抽卡动画
  await Promise.all(
    cardStore
      .at(ygopro.CardZone.HAND, draw.player)
      .map((card) => eventbus.call(Task.Move, card.uuid))
  );
};
