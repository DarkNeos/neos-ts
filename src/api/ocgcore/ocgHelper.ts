import { ygopro } from "./idl/ocgcore";
import socketMiddleWare, { socketCmd } from "../../middleware/socket";
import { IDeck } from "../Card";
import playerInfoPacket from "./ocgAdapter/ctos/ctosPlayerInfo";
import joinGamePacket from "./ocgAdapter/ctos/ctosJoinGame";
import CtosUpdateDeck from "./ocgAdapter/ctos/ctosUpdateDeck";

export function sendUpdateDeck(deck: IDeck) {
  const updateDeck = new ygopro.YgoCtosMsg({
    ctos_update_deck: new ygopro.CtosUpdateDeck({
      main: deck.main,
      extra: deck.extra,
      side: deck.side,
    }),
  });
  const payload = new CtosUpdateDeck(updateDeck).serialize();
  console.log(payload);

  socketMiddleWare({ cmd: socketCmd.SEND, payload });
}

export function sendHsReady() {
  const hasReady = new ygopro.YgoCtosMsg({
    ctos_hs_ready: new ygopro.CtosHsReady({}),
  });

  socketMiddleWare({ cmd: socketCmd.SEND, payload: hasReady.serialize() });
}

export function sendHsStart() {
  const hasStart = new ygopro.YgoCtosMsg({
    ctos_hs_start: new ygopro.CtosHsStart({}),
  });

  socketMiddleWare({ cmd: socketCmd.SEND, payload: hasStart.serialize() });
}

export function sendPlayerInfo(ws: WebSocket, player: string) {
  const playerInfo = new ygopro.YgoCtosMsg({
    ctos_player_info: new ygopro.CtosPlayerInfo({
      name: player,
    }),
  });
  const packet = new playerInfoPacket(playerInfo); // todo: 需要收敛在一个层次里

  ws.send(packet.serialize());
}

export function sendJoinGame(ws: WebSocket, version: number, passWd: string) {
  const joinGame = new ygopro.YgoCtosMsg({
    ctos_join_game: new ygopro.CtosJoinGame({
      version, // todo: use config
      gameid: 0,
      passwd: passWd,
    }),
  });
  const packet = new joinGamePacket(joinGame);

  ws.send(packet.serialize());
}
