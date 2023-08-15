/*
 * 一些发ygopro协议数据包的辅助函数，用于简化业务代码。
 *
 * */
import socketMiddleWare, { socketCmd } from "@/middleware/socket";
import { IDeck } from "@/stores";

import { ygopro } from "./idl/ocgcore";
import Chat from "./ocgAdapter/ctos/ctosChat";
import GameMsgResponse from "./ocgAdapter/ctos/ctosGameMsgResponse/mod";
import HandResult from "./ocgAdapter/ctos/ctosHandResult";
import HsNotReadyAdapter from "./ocgAdapter/ctos/ctosHsNotReady";
import HsReadyAdapter from "./ocgAdapter/ctos/ctosHsReady";
import HsStartAdapter from "./ocgAdapter/ctos/ctosHsStart";
import HsToDuelListAdapter from "./ocgAdapter/ctos/ctosHsToDuelList";
import HsToObserverAdapter from "./ocgAdapter/ctos/ctosHsToObserver";
import JoinGameAdapter from "./ocgAdapter/ctos/ctosJoinGame";
import PlayerInfoAdapter from "./ocgAdapter/ctos/ctosPlayerInfo";
import Surrender from "./ocgAdapter/ctos/ctosSurrender";
import TimeConfirm from "./ocgAdapter/ctos/ctosTimeConfirm";
import TpResult from "./ocgAdapter/ctos/ctosTpResult";
import UpdateDeckAdapter from "./ocgAdapter/ctos/ctosUpdateDeck";

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

export function sendHsNotReady() {
  const hasNotReady = new ygopro.YgoCtosMsg({
    ctos_hs_not_ready: new ygopro.CtosHsNotReady({}),
  });
  const payload = new HsNotReadyAdapter(hasNotReady).serialize();

  socketMiddleWare({ cmd: socketCmd.SEND, payload });
}

export function sendHsToObserver() {
  const hasToObserver = new ygopro.YgoCtosMsg({
    ctos_hs_to_observer: new ygopro.CtosHsToObserver({}),
  });
  const payload = new HsToObserverAdapter(hasToObserver).serialize();

  socketMiddleWare({ cmd: socketCmd.SEND, payload });
}

export function sendHsToDuelList() {
  const hasToDuelList = new ygopro.YgoCtosMsg({
    ctos_hs_to_duel_list: new ygopro.CtosHsToDuelList({}),
  });
  const payload = new HsToDuelListAdapter(hasToDuelList).serialize();

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

export function sendTpResult(isFirst: boolean) {
  let tp = ygopro.CtosTpResult.TpType.UNKNOWN;
  if (isFirst) {
    tp = ygopro.CtosTpResult.TpType.FIRST;
  } else {
    tp = ygopro.CtosTpResult.TpType.SECOND;
  }

  const tpResult = new ygopro.YgoCtosMsg({
    ctos_tp_result: new ygopro.CtosTpResult({
      tp,
    }),
  });
  const payload = new TpResult(tpResult).serialize();

  socketMiddleWare({ cmd: socketCmd.SEND, payload });
}

export function sendTimeConfirm() {
  const timeConfirm = new ygopro.YgoCtosMsg({
    ctos_time_confirm: new ygopro.CtosTimeConfirm({}),
  });
  const payload = new TimeConfirm(timeConfirm).serialize();

  socketMiddleWare({ cmd: socketCmd.SEND, payload });
}

export function sendSurrender() {
  const surrender = new ygopro.YgoCtosMsg({
    ctos_surrender: new ygopro.CtosSurrender({}),
  });
  const payload = new Surrender(surrender).serialize();

  socketMiddleWare({ cmd: socketCmd.SEND, payload });
}

export function sendChat(message: string) {
  const chat = new ygopro.YgoCtosMsg({
    ctos_chat: new ygopro.CtosChat({ message }),
  });
  const payload = new Chat(chat).serialize();

  socketMiddleWare({ cmd: socketCmd.SEND, payload });
}

export function sendSelectIdleCmdResponse(value: number) {
  const response = new ygopro.YgoCtosMsg({
    ctos_response: new ygopro.CtosGameMsgResponse({
      select_idle_cmd: new ygopro.CtosGameMsgResponse.SelectIdleCmdResponse({
        code: value,
      }),
    }),
  });
  const payload = new GameMsgResponse(response).serialize();

  socketMiddleWare({ cmd: socketCmd.SEND, payload });
}

export function sendSelectPlaceResponse(value: {
  controller: number;
  zone: ygopro.CardZone;
  sequence: number;
}) {
  const response = new ygopro.YgoCtosMsg({
    ctos_response: new ygopro.CtosGameMsgResponse({
      select_place: new ygopro.CtosGameMsgResponse.SelectPlaceResponse({
        player: value.controller,
        zone: value.zone,
        sequence: value.sequence,
      }),
    }),
  });
  const payload = new GameMsgResponse(response).serialize();

  socketMiddleWare({ cmd: socketCmd.SEND, payload });
}

export function sendSelectMultiResponse(value: number[]) {
  const response = new ygopro.YgoCtosMsg({
    ctos_response: new ygopro.CtosGameMsgResponse({
      select_multi: new ygopro.CtosGameMsgResponse.SelectMultiResponse({
        selected_ptrs: value,
      }),
    }),
  });
  const payload = new GameMsgResponse(response).serialize();

  socketMiddleWare({ cmd: socketCmd.SEND, payload });
}

export function sendSelectSingleResponse(value: number) {
  const response = new ygopro.YgoCtosMsg({
    ctos_response: new ygopro.CtosGameMsgResponse({
      select_single: new ygopro.CtosGameMsgResponse.SelectSingleResponse({
        selected_ptr: value,
      }),
    }),
  });
  const payload = new GameMsgResponse(response).serialize();

  socketMiddleWare({ cmd: socketCmd.SEND, payload });
}

export function sendSelectEffectYnResponse(value: boolean) {
  const response = new ygopro.YgoCtosMsg({
    ctos_response: new ygopro.CtosGameMsgResponse({
      select_effect_yn: new ygopro.CtosGameMsgResponse.SelectEffectYnResponse({
        selected: value,
      }),
    }),
  });
  const payload = new GameMsgResponse(response).serialize();

  socketMiddleWare({ cmd: socketCmd.SEND, payload });
}

export function sendSelectPositionResponse(value: ygopro.CardPosition) {
  const response = new ygopro.YgoCtosMsg({
    ctos_response: new ygopro.CtosGameMsgResponse({
      select_position: new ygopro.CtosGameMsgResponse.SelectPositionResponse({
        position: value,
      }),
    }),
  });
  const payload = new GameMsgResponse(response).serialize();

  socketMiddleWare({ cmd: socketCmd.SEND, payload });
}

export function sendSelectOptionResponse(value: number) {
  const response = new ygopro.YgoCtosMsg({
    ctos_response: new ygopro.CtosGameMsgResponse({
      select_option: new ygopro.CtosGameMsgResponse.SelectOptionResponse({
        code: value,
      }),
    }),
  });
  const payload = new GameMsgResponse(response).serialize();

  socketMiddleWare({ cmd: socketCmd.SEND, payload });
}

export function sendSelectBattleCmdResponse(value: number) {
  const response = new ygopro.YgoCtosMsg({
    ctos_response: new ygopro.CtosGameMsgResponse({
      select_battle_cmd: new ygopro.CtosGameMsgResponse.SelectBattleCmdResponse(
        {
          selected_cmd: value,
        },
      ),
    }),
  });
  const payload = new GameMsgResponse(response).serialize();

  socketMiddleWare({ cmd: socketCmd.SEND, payload });
}

export function sendSelectCounterResponse(counts: number[]) {
  const response = new ygopro.YgoCtosMsg({
    ctos_response: new ygopro.CtosGameMsgResponse({
      select_counter_response:
        new ygopro.CtosGameMsgResponse.SelectCounterResponse({
          selected_count: counts,
        }),
    }),
  });
  const payload = new GameMsgResponse(response).serialize();

  socketMiddleWare({ cmd: socketCmd.SEND, payload });
}

export function sendSortCardResponse(sortedIndexes: number[]) {
  const response = new ygopro.YgoCtosMsg({
    ctos_response: new ygopro.CtosGameMsgResponse({
      sort_card: new ygopro.CtosGameMsgResponse.SortCardResponse({
        sorted_index: sortedIndexes,
      }),
    }),
  });
  const payload = new GameMsgResponse(response).serialize();

  socketMiddleWare({ cmd: socketCmd.SEND, payload });
}
