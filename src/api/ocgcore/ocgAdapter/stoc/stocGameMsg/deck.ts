import { ygopro } from "../../../idl/ocgcore";
import { BufferReaderExt } from "../../bufferIO";

// 卡组操作共用内部消息，额外信息不参与网络上的 protobuf 序列化。
export interface DeckMessage extends ygopro.StocGameMessage.MsgShuffleDeck {
  deckOperation?:
    | { kind: "reverse" }
    | { kind: "top"; offset: number; code: number; faceup: boolean };
}

export default (data: Uint8Array, kind: "refresh" | "reverse" | "top") => {
  const reader = new BufferReaderExt(data);
  const message: DeckMessage = new ygopro.StocGameMessage.MsgShuffleDeck({
    player: kind === "reverse" ? 0 : reader.inner.readUint8(),
  });
  if (kind === "reverse") message.deckOperation = { kind };
  if (kind === "top") {
    const offset = reader.inner.readUint8();
    const code = reader.inner.readUint32();
    message.deckOperation = {
      kind,
      offset,
      code: code & 0x7fffffff,
      faceup: (code & 0x80000000) !== 0,
    };
  }
  return message;
};
