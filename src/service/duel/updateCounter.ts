import { ygopro } from "@/api";
import { updateMonsterCounters } from "@/reducers/duel/mod";
import { AppDispatch } from "@/store";
import MsgUpdateCounter = ygopro.StocGameMessage.MsgUpdateCounter;

export default (updateCounter: MsgUpdateCounter, dispatch: AppDispatch) => {
  dispatch(updateMonsterCounters(updateCounter.toObject()));
};
