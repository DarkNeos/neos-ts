import { fetchCard, ygopro } from "@/api";
import { sleep } from "@/infra";
import { AudioActionType, playEffect } from "@/infra/audio";
import { cardStore } from "@/stores";
import { callCardFocus, callCardMove } from "@/ui/Duel/PlayMat/Card";

const { MZONE, SZONE } = ygopro.CardZone;
const { FACEUP_ATTACK, FACEDOWN_ATTACK, FACEDOWN_DEFENSE, FACEDOWN } =
  ygopro.CardPosition;

const WAIT_TIME = 100;

export default async (confirmCards: ygopro.StocGameMessage.MsgConfirmCards) => {
  playEffect(AudioActionType.SOUND_REVEAL);
  const cards = confirmCards.cards;
  console.color("pink")(`confirmCards: ${cards}`);

  for (const card of cards) {
    const target = cardStore.at(card.location, card.controller, card.sequence);

    if (target) {
      // 设置`occupant`
      const meta = fetchCard(card.code);
      target.meta = meta;

      const zone = target.location.zone;
      const position = target.location.position;

      // 动画
      if (
        (zone === MZONE || zone === SZONE) &&
        (position === FACEDOWN_ATTACK ||
          position === FACEDOWN_DEFENSE ||
          position === FACEDOWN)
      ) {
        /* 这个分支确认盖卡（包括魔限和怪兽卡）的场景。
        /* 这里让盖卡向上翻开，再重新盖上
        /* TODO: 这里比较合理的做法应该是新实现一种动画。
        /* 这里暂时先使用这种简单的处理办法。*/
        target.location.position = FACEUP_ATTACK;
        await callCardMove(target.uuid);

        // 暂停一会再盖上
        await sleep(WAIT_TIME);

        // 恢复position
        target.location.position = position;
        await callCardMove(target.uuid);
      } else {
        // 这个分支是确认手卡或者卡组或者额外卡组的场景（大概）
        await callCardFocus(target.uuid);
        if (target.code === 0) {
          // 如果是对方或者是在观战模式下双方展示手牌，target的code会是0，
          // 这里应该清掉meta，UI上表现是回复到卡背状态
          target.meta = { id: 0, data: {}, text: {} };
        }
      }
    } else {
      console.warn(`card of ${card} is null`);
    }
  }
};
