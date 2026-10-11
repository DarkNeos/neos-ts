import { ygopro } from "@/api";
import { Container } from "@/container";
import { AudioActionType, playEffect } from "@/infra/audio";

type MsgUpdateCounter = ygopro.StocGameMessage.MsgUpdateCounter;

export default (container: Container, updateCounter: MsgUpdateCounter) => {
  const context = container.context;
  const {
    location,
    counter_type: counterType,
    action_type: actionType,
    count,
  } = updateCounter;

  const target = context.cardStore.find(location); // 不太确定这个后面能不能相应，我不好说
  if (target) {
    switch (actionType) {
      case ygopro.StocGameMessage.MsgUpdateCounter.ActionType.ADD: {
        if (counterType in target.counters) {
          target.counters[counterType] += count;
        } else {
          target.counters[counterType] = count;
        }
        playEffect(AudioActionType.SOUND_COUNTER_ADD);
        break;
      }
      case ygopro.StocGameMessage.MsgUpdateCounter.ActionType.REMOVE: {
        if (counterType in target.counters) {
          target.counters[counterType] = Math.max(
            0,
            target.counters[counterType] - count,
          );
        }
        playEffect(AudioActionType.SOUND_COUNTER_REMOVE);
        break;
      }
      default: {
        break;
      }
    }
  }
};
