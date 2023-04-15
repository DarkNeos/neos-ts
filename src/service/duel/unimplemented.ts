import { ygopro } from "@/api/ocgcore/idl/ocgcore";
import { setUnimplemented } from "@/reducers/duel/mod";
import { AppDispatch } from "@/store";

import NeosConfig from "../../../neos.config.json";

export default (
  unimplemented: ygopro.StocGameMessage.MsgUnimplemented,
  dispatch: AppDispatch
) => {
  if (!NeosConfig.unimplementedWhiteList.includes(unimplemented.command)) {
    dispatch(setUnimplemented(unimplemented.command));
  }
};
