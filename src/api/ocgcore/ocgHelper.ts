/*
 * 一些发ygopro协议数据包的辅助函数，用于简化业务代码。
 *
 * */
import { WebSocketStream } from "@/infra";
import { sendSocketData } from "@/middleware/socket";
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

export function sendUpdateDeck(conn: WebSocketStream, deck: IDeck) {
  const updateDeck = new ygopro.YgoCtosMsg({
    ctos_update_deck: new ygopro.CtosUpdateDeck({
      main: deck.main,
      extra: deck.extra,
      side: deck.side,
    }),
  });

  // FIXME: 如果要实现UI层和Adapter层解耦，这里应该不感知具体Adapter类型
  const payload = new UpdateDeckAdapter(updateDeck).serialize();

  sendSocketData(conn, payload);
}

export function sendHsReady(conn: WebSocketStream) {
  const hasReady = new ygopro.YgoCtosMsg({
    ctos_hs_ready: new ygopro.CtosHsReady({}),
  });
  const payload = new HsReadyAdapter(hasReady).serialize();

  sendSocketData(conn, payload);
}

export function sendHsNotReady(conn: WebSocketStream) {
  const hasNotReady = new ygopro.YgoCtosMsg({
    ctos_hs_not_ready: new ygopro.CtosHsNotReady({}),
  });
  const payload = new HsNotReadyAdapter(hasNotReady).serialize();

  sendSocketData(conn, payload);
}

export function sendHsToObserver(conn: WebSocketStream) {
  const hasToObserver = new ygopro.YgoCtosMsg({
    ctos_hs_to_observer: new ygopro.CtosHsToObserver({}),
  });
  const payload = new HsToObserverAdapter(hasToObserver).serialize();

  sendSocketData(conn, payload);
}

export function sendHsToDuelList(conn: WebSocketStream) {
  const hasToDuelList = new ygopro.YgoCtosMsg({
    ctos_hs_to_duel_list: new ygopro.CtosHsToDuelList({}),
  });
  const payload = new HsToDuelListAdapter(hasToDuelList).serialize();

  sendSocketData(conn, payload);
}

export function sendHsStart(conn: WebSocketStream) {
  const hasStart = new ygopro.YgoCtosMsg({
    ctos_hs_start: new ygopro.CtosHsStart({}),
  });
  const payload = new HsStartAdapter(hasStart).serialize();

  sendSocketData(conn, payload);
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

export function sendHandResult(conn: WebSocketStream, result: string) {
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

  sendSocketData(conn, payload);
}

export function sendTpResult(conn: WebSocketStream, isFirst: boolean) {
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

  sendSocketData(conn, payload);
}

export function sendTimeConfirm(conn: WebSocketStream) {
  const timeConfirm = new ygopro.YgoCtosMsg({
    ctos_time_confirm: new ygopro.CtosTimeConfirm({}),
  });
  const payload = new TimeConfirm(timeConfirm).serialize();

  sendSocketData(conn, payload);
}

export function sendSurrender(conn: WebSocketStream) {
  const surrender = new ygopro.YgoCtosMsg({
    ctos_surrender: new ygopro.CtosSurrender({}),
  });
  const payload = new Surrender(surrender).serialize();

  sendSocketData(conn, payload);
}

export function sendChat(conn: WebSocketStream, message: string) {
  const chat = new ygopro.YgoCtosMsg({
    ctos_chat: new ygopro.CtosChat({ message }),
  });
  const payload = new Chat(chat).serialize();

  sendSocketData(conn, payload);
}

export function sendSelectIdleCmdResponse(
  conn: WebSocketStream,
  value: number,
) {
  const response = new ygopro.YgoCtosMsg({
    ctos_response: new ygopro.CtosGameMsgResponse({
      select_idle_cmd: new ygopro.CtosGameMsgResponse.SelectIdleCmdResponse({
        code: value,
      }),
    }),
  });
  const payload = new GameMsgResponse(response).serialize();

  sendSocketData(conn, payload);
}

export function sendSelectPlaceResponse(
  conn: WebSocketStream,
  value: {
    controller: number;
    zone: ygopro.CardZone;
    sequence: number;
  },
) {
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

  sendSocketData(conn, payload);
}

export function sendSelectMultiResponse(
  conn: WebSocketStream,
  value: number[],
) {
  const response = new ygopro.YgoCtosMsg({
    ctos_response: new ygopro.CtosGameMsgResponse({
      select_multi: new ygopro.CtosGameMsgResponse.SelectMultiResponse({
        selected_ptrs: value,
      }),
    }),
  });
  const payload = new GameMsgResponse(response).serialize();

  sendSocketData(conn, payload);
}

export function sendSelectSingleResponse(conn: WebSocketStream, value: number) {
  const response = new ygopro.YgoCtosMsg({
    ctos_response: new ygopro.CtosGameMsgResponse({
      select_single: new ygopro.CtosGameMsgResponse.SelectSingleResponse({
        selected_ptr: value,
      }),
    }),
  });
  const payload = new GameMsgResponse(response).serialize();

  sendSocketData(conn, payload);
}

export function sendSelectEffectYnResponse(
  conn: WebSocketStream,
  value: boolean,
) {
  const response = new ygopro.YgoCtosMsg({
    ctos_response: new ygopro.CtosGameMsgResponse({
      select_effect_yn: new ygopro.CtosGameMsgResponse.SelectEffectYnResponse({
        selected: value,
      }),
    }),
  });
  const payload = new GameMsgResponse(response).serialize();

  sendSocketData(conn, payload);
}

export function sendSelectPositionResponse(
  conn: WebSocketStream,
  value: ygopro.CardPosition,
) {
  const response = new ygopro.YgoCtosMsg({
    ctos_response: new ygopro.CtosGameMsgResponse({
      select_position: new ygopro.CtosGameMsgResponse.SelectPositionResponse({
        position: value,
      }),
    }),
  });
  const payload = new GameMsgResponse(response).serialize();

  sendSocketData(conn, payload);
}

export function sendSelectOptionResponse(conn: WebSocketStream, value: number) {
  const response = new ygopro.YgoCtosMsg({
    ctos_response: new ygopro.CtosGameMsgResponse({
      select_option: new ygopro.CtosGameMsgResponse.SelectOptionResponse({
        code: value,
      }),
    }),
  });
  const payload = new GameMsgResponse(response).serialize();

  sendSocketData(conn, payload);
}

export function sendSelectBattleCmdResponse(
  conn: WebSocketStream,
  value: number,
) {
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

  sendSocketData(conn, payload);
}

export function sendSelectCounterResponse(
  conn: WebSocketStream,
  counts: number[],
) {
  const response = new ygopro.YgoCtosMsg({
    ctos_response: new ygopro.CtosGameMsgResponse({
      select_counter_response:
        new ygopro.CtosGameMsgResponse.SelectCounterResponse({
          selected_count: counts,
        }),
    }),
  });
  const payload = new GameMsgResponse(response).serialize();

  sendSocketData(conn, payload);
}

export function sendSortCardResponse(
  conn: WebSocketStream,
  sortedIndexes: number[],
) {
  const response = new ygopro.YgoCtosMsg({
    ctos_response: new ygopro.CtosGameMsgResponse({
      sort_card: new ygopro.CtosGameMsgResponse.SortCardResponse({
        sorted_index: sortedIndexes,
      }),
    }),
  });
  const payload = new GameMsgResponse(response).serialize();

  sendSocketData(conn, payload);
}
