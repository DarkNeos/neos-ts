import { ygopro } from "@/api";
import { useConfig } from "@/config";
import { setUnimplemented } from "@/reducers/duel/mod";
import { AppDispatch } from "@/store";
import { matStore } from "@/valtioStores";

const NeosConfig = useConfig();

export default (
  unimplemented: ygopro.StocGameMessage.MsgUnimplemented,
  dispatch: AppDispatch
) => {
  if (!NeosConfig.unimplementedWhiteList.includes(unimplemented.command)) {
    // dispatch(setUnimplemented(unimplemented.command));
    matStore.unimplemented = unimplemented.command;
  }
};
