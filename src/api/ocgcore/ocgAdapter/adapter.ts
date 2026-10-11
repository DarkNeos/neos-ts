import * as wire from "ygopro-msg-encode";

import { ygopro } from "../idl/ocgcore";
import { decodeGame } from "./decodeGame";
import { decodeHand } from "./handType";
import type { YgoProPacket } from "./packet";

function message<T extends wire.YGOProStocBase>(
  Type: new () => T,
  packet: YgoProPacket,
): T {
  return new Type().fromPayload(packet.exData);
}

/** 保留 Neos 的网络分包和业务对象，包体统一由编码库读取。 */
export function adaptStoc(packet: YgoProPacket): ygopro.YgoStocMsg {
  switch (packet.proto) {
    case wire.YGOProStocGameMsg.identifier:
      return new ygopro.YgoStocMsg({
        stoc_game_msg: decodeGame(packet.exData),
      });
    case wire.YGOProStocJoinGame.identifier: {
      const info =
        packet.exData.length >= 20
          ? message(wire.YGOProStocJoinGame, packet).info
          : undefined;
      return new ygopro.YgoStocMsg({
        stoc_join_game: new ygopro.StocJoinGame(
          info
            ? {
                ...info,
                no_check_deck: !!info.no_check_deck,
                no_shuffle_deck: !!info.no_shuffle_deck,
              }
            : { time_limit: -1 },
        ),
      });
    }
    case wire.YGOProStocChat.identifier: {
      const m = message(wire.YGOProStocChat, packet);
      return new ygopro.YgoStocMsg({
        stoc_chat: new ygopro.StocChat({ player: m.player_type, msg: m.msg }),
      });
    }
    case wire.YGOProStocHsPlayerEnter.identifier: {
      const m = message(wire.YGOProStocHsPlayerEnter, packet);
      return new ygopro.YgoStocMsg({
        stoc_hs_player_enter: new ygopro.StocHsPlayerEnter({
          name: m.name,
          pos: m.pos & 3,
        }),
      });
    }
    case wire.YGOProStocHsPlayerChange.identifier: {
      const { status } = message(wire.YGOProStocHsPlayerChange, packet);
      const pos = status >> 4;
      const state = status & 15;
      const S = ygopro.StocHsPlayerChange.State;
      return new ygopro.YgoStocMsg({
        stoc_hs_player_change: new ygopro.StocHsPlayerChange({
          pos,
          state:
            pos >= 4
              ? S.UNKNOWN
              : state < 8
              ? S.MOVE
              : (
                  {
                    8: S.TO_OBSERVER,
                    9: S.READY,
                    10: S.NO_READY,
                    11: S.LEAVE,
                  } as Record<number, ygopro.StocHsPlayerChange.State>
                )[state] ?? S.UNKNOWN,
          moved_pos: pos < 4 && state < 8 ? state : undefined,
        }),
      });
    }
    case wire.YGOProStocHsWatchChange.identifier:
      return new ygopro.YgoStocMsg({
        stoc_hs_watch_change: new ygopro.StocHsWatchChange({
          count: message(wire.YGOProStocHsWatchChange, packet).watch_count,
        }),
      });
    case wire.YGOProStocTypeChange.identifier: {
      const { type } = message(wire.YGOProStocTypeChange, packet);
      const pos = type & 15;
      return new ygopro.YgoStocMsg({
        stoc_type_change: new ygopro.StocTypeChange({
          is_host: type >> 4 !== 0,
          self_type:
            pos === 7
              ? ygopro.StocTypeChange.SelfType.OBSERVER
              : pos <= 5
              ? pos + 1
              : ygopro.StocTypeChange.SelfType.UNKNOWN,
        }),
      });
    }
    case wire.YGOProStocHandResult.identifier: {
      const m = message(wire.YGOProStocHandResult, packet);
      return new ygopro.YgoStocMsg({
        stoc_hand_result: new ygopro.StocHandResult({
          meResult: decodeHand(m.res1),
          opResult: decodeHand(m.res2),
        }),
      });
    }
    case wire.YGOProStocDeckCount.identifier: {
      const m = message(wire.YGOProStocDeckCount, packet);
      return new ygopro.YgoStocMsg({
        stoc_deck_count: new ygopro.StocDeckCount({
          meMain: m.player0DeckCount.main,
          meExtra: m.player0DeckCount.extra,
          meSide: m.player0DeckCount.side,
          opMain: m.player1DeckCount.main,
          opExtra: m.player1DeckCount.extra,
          opSide: m.player1DeckCount.side,
        }),
      });
    }
    case wire.YGOProStocTimeLimit.identifier: {
      const m = message(wire.YGOProStocTimeLimit, packet);
      return new ygopro.YgoStocMsg({
        stoc_time_limit: new ygopro.StocTimeLimit({
          player: m.player,
          left_time: m.left_time,
        }),
      });
    }
    case wire.YGOProStocErrorMsg.identifier: {
      const m = message(wire.YGOProStocErrorMsg, packet);
      return new ygopro.YgoStocMsg({
        stoc_error_msg: new ygopro.StocErrorMsg({
          error_type: Number(m.msg),
          error_code: m.code | 0,
        }),
      });
    }
    case wire.YGOProStocSelectHand.identifier:
      message(wire.YGOProStocSelectHand, packet);
      return new ygopro.YgoStocMsg({
        stoc_select_hand: new ygopro.StocSelectHand({}),
      });
    case wire.YGOProStocSelectTp.identifier:
      message(wire.YGOProStocSelectTp, packet);
      return new ygopro.YgoStocMsg({
        stoc_select_tp: new ygopro.StocSelectTp({}),
      });
    case wire.YGOProStocDuelStart.identifier:
      message(wire.YGOProStocDuelStart, packet);
      return new ygopro.YgoStocMsg({
        stoc_duel_start: new ygopro.StocDuelStart({}),
      });
    case wire.YGOProStocDuelEnd.identifier:
      message(wire.YGOProStocDuelEnd, packet);
      return new ygopro.YgoStocMsg({
        stoc_duel_end: new ygopro.StocDuelEnd({}),
      });
    case wire.YGOProStocChangeSide.identifier:
      message(wire.YGOProStocChangeSide, packet);
      return new ygopro.YgoStocMsg({
        stoc_change_side: new ygopro.StocChangeSide({}),
      });
    case wire.YGOProStocWaitingSide.identifier:
      message(wire.YGOProStocWaitingSide, packet);
      return new ygopro.YgoStocMsg({
        stoc_waiting_side: new ygopro.StocWaitingSide({}),
      });
    default:
      return new ygopro.YgoStocMsg({});
  }
}
