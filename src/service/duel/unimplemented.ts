import { ygopro } from "@/api";
import { useConfig } from "@/config";
import { matStore } from "@/stores";

const NeosConfig = useConfig();

export default (unimplemented: ygopro.StocGameMessage.MsgUnimplemented) => {
  if (!NeosConfig.unimplementedWhiteList.includes(unimplemented.command)) {
    matStore.unimplemented = unimplemented.command;
  }
};
