import { ygopro } from "../../../idl/ocgcore";
import { BufferReaderExt } from "../../bufferIO";
import MsgUpdateCounter = ygopro.StocGameMessage.MsgUpdateCounter;

/*
 * Msg Remove Counter
 * @param - TODO
 *
 * @usage - TODO
 * */
export default (data: Uint8Array) => {
  const reader = new BufferReaderExt(data);

  const counterType = reader.inner.readUint16();
  const location = reader.readCardShortLocation();
  const count = reader.inner.readUint16();

  return new MsgUpdateCounter({
    counter_type: counterType,
    location,
    action_type: MsgUpdateCounter.ActionType.REMOVE,
    count,
  });
};
