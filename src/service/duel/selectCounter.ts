import { ygopro } from "@/api";
import { cardStore } from "@/stores";
import { displayCheckCounterModal } from "@/ui/Duel/Message";
type MsgSelectCounter = ygopro.StocGameMessage.MsgSelectCounter;

export default async (selectCounter: MsgSelectCounter) => {
  await displayCheckCounterModal({
    counterType: selectCounter.counter_type,
    min: selectCounter.min,
    options: selectCounter.options!.map(({ location, code, counter_count }) => {
      const id = cardStore.find(location)?.code;
      const newCode = code ? code : id || 0;

      return {
        code: newCode,
        max: counter_count!,
      };
    }),
  });
};
