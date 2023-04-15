import { ygopro } from "@/api/ocgcore/idl/ocgcore";
import { useConfig } from "@/config";
import { setUnimplemented } from "@/reducers/duel/mod";
import { AppDispatch } from "@/store";

const NeosConfig = useConfig();

export default (
  unimplemented: ygopro.StocGameMessage.MsgUnimplemented,
  dispatch: AppDispatch
) => {
  if (!NeosConfig.unimplementedWhiteList.includes(unimplemented.command)) {
    dispatch(setUnimplemented(unimplemented.command));
  }
};
