import { ygopro } from "@/api";
import { updateMonsterCounters } from "@/reducers/duel/mod";
import { AppDispatch } from "@/store";
import { getCardByLocation } from "@/valtioStores";

type MsgUpdateCounter = ygopro.StocGameMessage.MsgUpdateCounter;

export default (updateCounter: MsgUpdateCounter, dispatch: AppDispatch) => {
  // dispatch(updateMonsterCounters(updateCounter.toObject()));
  const { location, count, action_type: counterType } = updateCounter;
  const target = getCardByLocation(location); // 不太确定这个后面能不能相应，我不好说
  if (target) {
    switch (counterType) {
      case ygopro.StocGameMessage.MsgUpdateCounter.ActionType.ADD: {
        if (counterType in target.counters) {
          target.counters[counterType] += count;
        } else {
          target.counters[counterType] = count;
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
