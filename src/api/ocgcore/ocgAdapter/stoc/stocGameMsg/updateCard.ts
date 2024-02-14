import { ygopro } from "../../../idl/ocgcore";
import { BufferReaderExt } from "../../bufferIO";
import { numberToCardZone, readUpdateAction } from "../../util";
import MsgUpdateData = ygopro.StocGameMessage.MsgUpdateData;

/*
 * Msg UpdateCard
 *
 * @param - TODO
 *
 * @usage - ygopro后端通知前端更新单张卡片的元数据
 * */
export default (data: Uint8Array) => {
  const reader = new BufferReaderExt(data);

  const player = reader.inner.readUint8();
  const zone = numberToCardZone(reader.inner.readUint8());
  const sequence = reader.inner.readUint8();
  // pending
  reader.inner.readUint32();

  const msg = new MsgUpdateData({ player, zone, actions: [] });
  const action = readUpdateAction(reader);
  if (action) {
    if (action.location !== undefined && zone !== undefined) {
      action.location.controller = player;
      action.location.zone = zone;
      action.location.sequence = sequence;
    }
    msg.actions.push(action);
  }

  return msg;
};
