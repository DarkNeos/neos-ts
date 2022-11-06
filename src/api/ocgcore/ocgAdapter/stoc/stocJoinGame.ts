import { ygopro } from "../../idl/ocgcore";
import { YgoProPacket, StocAdapter } from "../packet";

/*
 * STOC JoinGame
 *
 * @usage - 告知客户端/前端已成功加入房间
 * */
export default class JoinGameAdapter implements StocAdapter {
  packet: YgoProPacket;

  constructor(packet: YgoProPacket) {
    this.packet = packet;
  }

  upcast(): ygopro.YgoStocMsg {
    // TODO
    return new ygopro.YgoStocMsg({
      stoc_join_game: new ygopro.StocJoinGame({}),
    });
  }
}
