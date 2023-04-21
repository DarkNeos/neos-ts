import { ygopro } from "@/api";
import { setCheckCounter } from "@/reducers/duel/mod";
import { AppDispatch } from "@/store";
import { messageStore, getCardByLocation } from "@/valtioStores";
type MsgSelectCounter = ygopro.StocGameMessage.MsgSelectCounter;

export default (selectCounter: MsgSelectCounter, dispatch: AppDispatch) => {
  dispatch(setCheckCounter(selectCounter.toObject()));

  messageStore.checkCounterModal.counterType = selectCounter.counter_type;
  messageStore.checkCounterModal.min = selectCounter.min;
  messageStore.checkCounterModal.options = selectCounter.options!.map(
    ({ location, code, counter_count }) => {
      const id = getCardByLocation(location)?.occupant?.id;
      const newCode = code ? code : id || 0;

      return {
        code: newCode,
        max: counter_count!,
      };
    }
  );
  messageStore.checkCounterModal.isOpen = true;
};
