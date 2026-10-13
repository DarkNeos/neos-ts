/*
 * 一些发ygopro协议数据包的辅助函数，用于简化业务代码。
 *
 * */
import { WebSocketStream } from "@/infra";
import { sendSocketData } from "@/middleware/socket";
import { IDeck } from "@/stores";

import { ygopro } from "./idl/ocgcore";
import { encodeCtos } from "./ocgAdapter/encodeCtos";

interface SelectPlaceResponseValue {
  controller: number;
  zone: ygopro.CardZone;
  sequence: number;
}

export function sendUpdateDeck(conn: WebSocketStream, deck: IDeck) {
  const updateDeck = new ygopro.YgoCtosMsg({
    ctos_update_deck: new ygopro.CtosUpdateDeck({
      main: deck.main,
      extra: deck.extra,
      side: deck.side,
    }),
  });

  const payload = encodeCtos(updateDeck);

  sendSocketData(conn, payload);
}

export function sendHsReady(conn: WebSocketStream) {
  const hasReady = new ygopro.YgoCtosMsg({
    ctos_hs_ready: new ygopro.CtosHsReady({}),
  });
  const payload = encodeCtos(hasReady);

  sendSocketData(conn, payload);
}

export function sendHsNotReady(conn: WebSocketStream) {
  const hasNotReady = new ygopro.YgoCtosMsg({
    ctos_hs_not_ready: new ygopro.CtosHsNotReady({}),
  });
  const payload = encodeCtos(hasNotReady);

  sendSocketData(conn, payload);
}

export function sendHsToObserver(conn: WebSocketStream) {
  const hasToObserver = new ygopro.YgoCtosMsg({
    ctos_hs_to_observer: new ygopro.CtosHsToObserver({}),
  });
  const payload = encodeCtos(hasToObserver);

  sendSocketData(conn, payload);
}

export function sendHsToDuelList(conn: WebSocketStream) {
  const hasToDuelList = new ygopro.YgoCtosMsg({
    ctos_hs_to_duel_list: new ygopro.CtosHsToDuelList({}),
  });
  const payload = encodeCtos(hasToDuelList);

  sendSocketData(conn, payload);
}

export function sendHsStart(conn: WebSocketStream) {
  const hasStart = new ygopro.YgoCtosMsg({
    ctos_hs_start: new ygopro.CtosHsStart({}),
  });
  const payload = encodeCtos(hasStart);

  sendSocketData(conn, payload);
}

export function sendPlayerInfo(ws: WebSocket, player: string) {
  const playerInfo = new ygopro.YgoCtosMsg({
    ctos_player_info: new ygopro.CtosPlayerInfo({
      name: player,
    }),
  });
  ws.send(encodeCtos(playerInfo));
}

export function sendJoinGame(ws: WebSocket, version: number, passWd: string) {
  const joinGame = new ygopro.YgoCtosMsg({
    ctos_join_game: new ygopro.CtosJoinGame({
      version, // todo: use config
      gameid: 0,
      passwd: passWd,
    }),
  });
  ws.send(encodeCtos(joinGame));
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
  const payload = encodeCtos(handResult);

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
  const payload = encodeCtos(tpResult);

  sendSocketData(conn, payload);
}

export function sendTimeConfirm(conn: WebSocketStream) {
  const timeConfirm = new ygopro.YgoCtosMsg({
    ctos_time_confirm: new ygopro.CtosTimeConfirm({}),
  });
  const payload = encodeCtos(timeConfirm);

  sendSocketData(conn, payload);
}

export function sendSurrender(conn: WebSocketStream) {
  const surrender = new ygopro.YgoCtosMsg({
    ctos_surrender: new ygopro.CtosSurrender({}),
  });
  const payload = encodeCtos(surrender);

  sendSocketData(conn, payload);
}

export function sendChat(conn: WebSocketStream, message: string) {
  const chat = new ygopro.YgoCtosMsg({
    ctos_chat: new ygopro.CtosChat({ message }),
  });
  const payload = encodeCtos(chat);

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
  const payload = encodeCtos(response);

  return sendSocketData(conn, payload);
}

export function sendSelectPlaceResponse(
  conn: WebSocketStream,
  value: SelectPlaceResponseValue | SelectPlaceResponseValue[],
) {
  const values = Array.isArray(value) ? value : [value];
  const first = values[0];
  const response = new ygopro.YgoCtosMsg({
    ctos_response: new ygopro.CtosGameMsgResponse({
      select_place: new ygopro.CtosGameMsgResponse.SelectPlaceResponse({
        player: first.controller,
        zone: first.zone,
        sequence: first.sequence,
        places: values.map(
          (place) =>
            new ygopro.CtosGameMsgResponse.SelectPlaceResponse.Place({
              player: place.controller,
              zone: place.zone,
              sequence: place.sequence,
            }),
        ),
      }),
    }),
  });
  const payload = encodeCtos(response);

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
  const payload = encodeCtos(response);

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
  const payload = encodeCtos(response);

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
  const payload = encodeCtos(response);

  return sendSocketData(conn, payload);
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
  const payload = encodeCtos(response);

  return sendSocketData(conn, payload);
}

export function sendSelectOptionResponse(conn: WebSocketStream, value: number) {
  const response = new ygopro.YgoCtosMsg({
    ctos_response: new ygopro.CtosGameMsgResponse({
      select_option: new ygopro.CtosGameMsgResponse.SelectOptionResponse({
        code: value,
      }),
    }),
  });
  const payload = encodeCtos(response);

  return sendSocketData(conn, payload);
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
  const payload = encodeCtos(response);

  return sendSocketData(conn, payload);
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
  const payload = encodeCtos(response);

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
  const payload = encodeCtos(response);

  sendSocketData(conn, payload);
}
