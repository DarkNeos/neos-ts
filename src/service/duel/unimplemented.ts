import { ygopro } from "@/api";
import { useConfig } from "@/config";
import { Container } from "@/container";

const NeosConfig = useConfig();

export default (
  container: Container,
  unimplemented: ygopro.StocGameMessage.MsgUnimplemented,
) => {
  if (!NeosConfig.unimplementedWhiteList.includes(unimplemented.command)) {
    container.context.matStore.unimplemented = unimplemented.command;
  }
};
