import { ygopro } from "../../../idl/ocgcore";
import { BufferReaderExt } from "../../bufferIO";
import MsgSortCard = ygopro.StocGameMessage.MsgSortCard;

/*
 *
 * Msg Sort Card
 *
 * @param - TODO
 * @usage - TODO
 * */
export default (data: Uint8Array) => {
  const reader = new BufferReaderExt(data);

  const player = reader.inner.readUint8();

  const msg = new MsgSortCard({
    player,
    options: [],
  });

  const count = reader.inner.readUint8();
  for (let i = 0; i < count; i++) {
    const code = reader.inner.readUint32();
    const location = reader.readCardShortLocation();

    msg.options.push(
      new MsgSortCard.Info({
        code,
        location,
        response: i,
      }),
    );
  }

  return msg;
};
