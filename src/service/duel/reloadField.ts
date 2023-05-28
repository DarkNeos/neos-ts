import { ygopro } from "@/api";
type MsgReloadField = ygopro.StocGameMessage.MsgReloadField;

export default (field: MsgReloadField) => {
  // TODO: 断线重连比较复杂，先留着后面时实现
};
