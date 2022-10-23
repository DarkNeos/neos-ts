import { ygopro } from "../../idl/ocgcore";
import { ygoProPacket, ygoProtobuf } from "../packet";

export default class StocJoinGamePB implements ygoProtobuf {
  packet: ygoProPacket;

  constructor(packet: ygoProPacket) {
    this.packet = packet;
  }

  adapt(): ygopro.YgoStocMsg {
    // todo
    return new ygopro.YgoStocMsg({
      stoc_join_game: new ygopro.StocJoinGame({}),
    });
  }
}
