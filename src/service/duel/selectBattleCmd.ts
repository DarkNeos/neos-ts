import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import { AppDispatch } from "../../store";
import MsgSelectBattleCmd = ygopro.StocGameMessage.MsgSelectBattleCmd;

export default (selectBattleCmd: MsgSelectBattleCmd, dispatch: AppDispatch) => {
  console.log(selectBattleCmd);
};
