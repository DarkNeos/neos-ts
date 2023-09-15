import { ygopro } from "../../../idl/ocgcore";
import { BufferReaderExt } from "../../bufferIO";
import { numberToCardZone, readUpdateAction } from "../../util";
import MsgUpdateData = ygopro.StocGameMessage.MsgUpdateData;

/*
 * Msg UpdateData
 *
 * @param - todo
 *
 * @usage - ygopro后端通知前端更新卡片元数据
 * */
export default (data: Uint8Array) => {
  const reader = new BufferReaderExt(data);

  const player = reader.inner.readUint8();
  const zone = numberToCardZone(reader.inner.readUint8());

  const msg = new MsgUpdateData({
    player,
    zone,
    actions: [],
  });

  try {
    while (true) {
      const len = reader.inner.readInt32();
      if (len === 4) continue;
      const pos = reader.inner.offset();
      const action = readUpdateAction(reader);
      if (action) {
        msg.actions.push(action);
      }
      reader.inner.setOffset(pos + len - 4);
    }
  } catch (e) {
    // console.log(e)
  }

  return msg;
};
