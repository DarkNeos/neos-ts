import { ygopro } from "../../idl/ocgcore";
import { ygoProPacket, StocAdapter } from "../packet";

export default class joinGameAdapter implements StocAdapter {
  packet: ygoProPacket;

  constructor(packet: ygoProPacket) {
    this.packet = packet;
  }

  upcast(): ygopro.YgoStocMsg {
    // todo
    return new ygopro.YgoStocMsg({
      stoc_join_game: new ygopro.StocJoinGame({}),
    });
  }
}
