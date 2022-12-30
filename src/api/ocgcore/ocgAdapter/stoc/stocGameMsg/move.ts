import { ygopro } from "../../../idl/ocgcore";
import { BufferReader } from "../../bufferIO";
import {
  cardZoneToNumber,
  numberToCardPosition,
  numberToCardZone,
} from "../../util";
import MsgMove = ygopro.StocGameMessage.MsgMove;

/*
 * Msg Move
 * @param - TODO
 *
 * @usage - 服务端告知前端/客户端卡牌移动信息
 * */

export default (data: Uint8Array) => {
  const reader = new BufferReader(data, true);

  const code = reader.readUint32();

  const readCardLocation = () => {
    const controler = reader.readUint8();
    const location = reader.readUint8();
    const sequence = reader.readUint8();
    const ss = reader.readUint8();

    const cardLocation = new ygopro.CardLocation({
      controler,
      location: numberToCardZone(location),
      sequence,
    });

    if (location != cardZoneToNumber(ygopro.CardZone.OVERLAY)) {
      const position = numberToCardPosition(ss);
      if (position) {
        cardLocation.position = position;
      }
    } else {
      cardLocation.overlay_sequence = ss;
    }

    return cardLocation;
  };

  const fromLocation = readCardLocation();
  const toLocation = readCardLocation();

  return new MsgMove({
    code,
    from: fromLocation,
    to: toLocation,
    reason: reader.readUint8(),
  });
};
