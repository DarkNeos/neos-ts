import { ygopro } from "@/api";
import { getCardByLocation, messageStore } from "@/stores";
type MsgSelectCounter = ygopro.StocGameMessage.MsgSelectCounter;

export default (selectCounter: MsgSelectCounter) => {
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
