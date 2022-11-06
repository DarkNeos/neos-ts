import { ygopro } from "../../idl/ocgcore";
import { YgoProPacket } from "../packet";
import { CTOS_UPDATE_DECK } from "../protoDecl";

const BYTES_PER_U32 = 4;

/*
 * CTOS UpdateDeck
 *
 * @param main: unsigned int - 主卡组数目
 * @param extra: unsigned int - 额外卡组数目
 * @param side: unsigned int - 副卡组数目
 * @param mainCards: [unsigned int; main] - 主卡组数据
 * @param extraCards: [unsigned int; extra] - 额外卡组数据
 * @param side: [unsigned int; side] - 副卡组数据
 *
 * @usage - 更新对局的卡组信息
 * */
export default class CtosUpdateDeck extends YgoProPacket {
  constructor(pb: ygopro.YgoCtosMsg) {
    const updateDeck = pb.ctos_update_deck;
    const main = updateDeck.main;
    const extra = updateDeck.extra;
    const side = updateDeck.side;

    const mainLen = main.length + extra.length;
    const sideLen = side.length;

    const exDataLen = (2 + mainLen + sideLen) * BYTES_PER_U32;
    const exData = new Uint8Array(exDataLen);
    const dataView = new DataView(exData.buffer);

    dataView.setInt32(0, mainLen, true);
    dataView.setInt32(1 * BYTES_PER_U32, sideLen, true);

    let offset = 2;
    for (let card of main) {
      dataView.setInt32(offset * BYTES_PER_U32, card, true);
      offset += 1;
    }
    for (let card of extra) {
      dataView.setInt32(offset * BYTES_PER_U32, card, true);
      offset += 1;
    }
    for (let card of side) {
      dataView.setInt32(offset * BYTES_PER_U32, card, true);
      offset += 1;
    }

    super(exDataLen + 3, CTOS_UPDATE_DECK, exData);
  }
}
