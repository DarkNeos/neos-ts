import { ygopro } from "@/api";
import { Container } from "@/container";
import { AudioActionType, playEffect } from "@/infra/audio";

type MsgUpdateCounter = ygopro.StocGameMessage.MsgUpdateCounter;

export default (container: Container, updateCounter: MsgUpdateCounter) => {
  const context = container.context;
  const { location, count, action_type: counterType } = updateCounter;

  const target = context.cardStore.find(location); // 不太确定这个后面能不能相应，我不好说
  if (target) {
    switch (counterType) {
      case ygopro.StocGameMessage.MsgUpdateCounter.ActionType.ADD: {
        if (counterType in target.counters) {
          target.counters[counterType] += count;
          playEffect(AudioActionType.SOUND_COUNTER_ADD);
        } else {
          target.counters[counterType] = count;
          playEffect(AudioActionType.SOUND_COUNTER_REMOVE);
        }
        break;
      }
      case ygopro.StocGameMessage.MsgUpdateCounter.ActionType.REMOVE: {
        if (counterType in target.counters) {
          target.counters[counterType] -= count;
        }
        break;
      }
      default: {
        break;
      }
    }
  }
};
