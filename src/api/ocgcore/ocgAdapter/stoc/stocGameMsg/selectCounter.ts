import { ygopro } from "../../../idl/ocgcore";
import { BufferReaderExt } from "../../bufferIO";
import MsgSelectCounter = ygopro.StocGameMessage.MsgSelectCounter;

/*
 * Msg Select Counter
 *
 * @param - TODO
 * @usage - TODO
 **/
export default (data: Uint8Array) => {
  const reader = new BufferReaderExt(data);

  const player = reader.inner.readUint8();
  const counterType = reader.inner.readUint16();
  const min = reader.inner.readUint16();

  const msg = new MsgSelectCounter({
    player,
    counter_type: counterType,
    min,
    options: [],
  });

  const count = reader.inner.readUint8();
  for (let i = 0; i < count; i++) {
    const code = reader.inner.readUint32();
    const location = reader.readCardShortLocation();
    const counterCount = reader.inner.readUint16();

    msg.options.push(
      new MsgSelectCounter.Info({
        code,
        location,
        counter_count: counterCount,
      }),
    );
  }

  return msg;
};
