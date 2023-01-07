import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import { AppDispatch } from "../../store";
import MsgSelectChain = ygopro.StocGameMessage.MsgSelectChain;

export default (selectChain: MsgSelectChain, dispatch: AppDispatch) => {
  const player = selectChain.player;
  const spCount = selectChain.special_count;
  const forced = selectChain.forced;
  const hint0 = selectChain.hint0;
  const hint1 = selectChain.hint1;
  const chains = selectChain.chains;
};
