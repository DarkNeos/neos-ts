/*
 * 一些发ygopro协议数据包的辅助函数，用于简化业务代码。
 *
 * */
import { ygopro } from "./idl/ocgcore";
import socketMiddleWare, { socketCmd } from "../../middleware/socket";
import { IDeck } from "../Card";
import PlayerInfoAdapter from "./ocgAdapter/ctos/ctosPlayerInfo";
import JoinGameAdapter from "./ocgAdapter/ctos/ctosJoinGame";
import UpdateDeckAdapter from "./ocgAdapter/ctos/ctosUpdateDeck";
import HsReadyAdapter from "./ocgAdapter/ctos/ctosHsReady";
import HsStartAdapter from "./ocgAdapter/ctos/ctosHsStart";
import HandResult from "./ocgAdapter/ctos/ctosHandResult";

export function sendUpdateDeck(deck: IDeck) {
  const updateDeck = new ygopro.YgoCtosMsg({
    ctos_update_deck: new ygopro.CtosUpdateDeck({
      main: deck.main,
      extra: deck.extra,
      side: deck.side,
    }),
  });

  // FIXME: 如果要实现UI层和Adapter层解耦，这里应该不感知具体Adapter类型
  const payload = new UpdateDeckAdapter(updateDeck).serialize();

  socketMiddleWare({ cmd: socketCmd.SEND, payload });
}

export function sendHsReady() {
  const hasReady = new ygopro.YgoCtosMsg({
    ctos_hs_ready: new ygopro.CtosHsReady({}),
  });
  const payload = new HsReadyAdapter(hasReady).serialize();

  socketMiddleWare({ cmd: socketCmd.SEND, payload });
}

export function sendHsStart() {
  const hasStart = new ygopro.YgoCtosMsg({
    ctos_hs_start: new ygopro.CtosHsStart({}),
  });
  const payload = new HsStartAdapter(hasStart).serialize();

  socketMiddleWare({ cmd: socketCmd.SEND, payload });
}

export function sendPlayerInfo(ws: WebSocket, player: string) {
  const playerInfo = new ygopro.YgoCtosMsg({
    ctos_player_info: new ygopro.CtosPlayerInfo({
      name: player,
    }),
  });
  const packet = new PlayerInfoAdapter(playerInfo);

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
  const packet = new JoinGameAdapter(joinGame);

  ws.send(packet.serialize());
}

export function sendHandResult(result: string) {
  let hand = ygopro.HandType.UNKNOWN;
  if (result === "scissors") {
    hand = ygopro.HandType.SCISSORS;
  } else if (result === "rock") {
    hand = ygopro.HandType.ROCK;
  } else if (result === "paper") {
    hand = ygopro.HandType.PAPER;
  }

  const handResult = new ygopro.YgoCtosMsg({
    ctos_hand_result: new ygopro.CtosHandResult({
      hand,
    }),
  });
  const payload = new HandResult(handResult).serialize();

  socketMiddleWare({ cmd: socketCmd.SEND, payload });
}
