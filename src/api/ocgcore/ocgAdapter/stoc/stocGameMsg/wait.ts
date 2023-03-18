import { ygopro } from "../../../idl/ocgcore";
import MsgWait = ygopro.StocGameMessage.MsgWait;

/*
 * Msg Wait
 *
 * @param - null
 *
 * @usage - 后端通知前端等待对手操作
 * */
export default (_data: Uint8Array) => {
  return new MsgWait({});
};
