import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import { updateHp } from "../../reducers/duel/mod";
import { AppDispatch } from "../../store";
import MsgUpdateHp = ygopro.StocGameMessage.MsgUpdateHp;

export default (msgUpdateHp: MsgUpdateHp, dispatch: AppDispatch) => {
  dispatch(updateHp(msgUpdateHp));
};
