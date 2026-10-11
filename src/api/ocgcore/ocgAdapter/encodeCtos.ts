import YGOProDeck from "ygopro-deck-encode";
import * as wire from "ygopro-msg-encode";

import { ygopro } from "../idl/ocgcore";
import GameMsgResponse from "./ctos/ctosGameMsgResponse/mod";

/** 业务对象只在此转换，网络长度、字符串和协议包体交给编码库。 */
export function encodeCtos(pb: ygopro.YgoCtosMsg): Uint8Array {
  let message: wire.YGOProCtosBase;
  switch (pb.msg) {
    case "ctos_player_info":
      message = new wire.YGOProCtosPlayerInfo().fromPartial({
        name: pb.ctos_player_info.name,
      });
      break;
    case "ctos_join_game":
      message = new wire.YGOProCtosJoinGame().fromPartial({
        version: pb.ctos_join_game.version,
        gameid: pb.ctos_join_game.gameid,
        pass: pb.ctos_join_game.passwd,
      });
      break;
    case "ctos_update_deck":
      message = new wire.YGOProCtosUpdateDeck().fromPartial({
        deck: new YGOProDeck({
          main: pb.ctos_update_deck.main,
          extra: pb.ctos_update_deck.extra,
          side: pb.ctos_update_deck.side,
        }),
      });
      break;
    case "ctos_response":
      // 选择值沿用现有 UI 语义，外层 CTOS 编码统一交给库。
      message = new wire.YGOProCtosResponse().fromPartial({
        response: new GameMsgResponse(pb).exData,
      });
      break;
    case "ctos_chat":
      message = new wire.YGOProCtosChat().fromPartial({
        msg: pb.ctos_chat.message,
      });
      break;
    case "ctos_hand_result":
      message = new wire.YGOProCtosHandResult().fromPartial({
        // 服务器使用 1=剪刀、2=石头、3=布，不能直接传内部 HandType 枚举。
        res: (pb.ctos_hand_result.hand === ygopro.HandType.SCISSORS
          ? 1
          : pb.ctos_hand_result.hand === ygopro.HandType.ROCK
          ? 2
          : pb.ctos_hand_result.hand === ygopro.HandType.PAPER
          ? 3
          : 0) as wire.HandResult,
      });
      break;
    case "ctos_tp_result":
      message = new wire.YGOProCtosTpResult().fromPartial({
        res: pb.ctos_tp_result.tp === ygopro.CtosTpResult.TpType.FIRST ? 1 : 0,
      });
      break;
    case "ctos_hs_ready":
      message = new wire.YGOProCtosHsReady();
      break;
    case "ctos_hs_not_ready":
      message = new wire.YGOProCtosHsNotReady();
      break;
    case "ctos_hs_start":
      message = new wire.YGOProCtosHsStart();
      break;
    case "ctos_hs_to_duel_list":
      message = new wire.YGOProCtosHsToDuelist();
      break;
    case "ctos_hs_to_observer":
      message = new wire.YGOProCtosHsToObserver();
      break;
    case "ctos_surrender":
      message = new wire.YGOProCtosSurrender();
      break;
    case "ctos_time_confirm":
      message = new wire.YGOProCtosTimeConfirm();
      break;
    default:
      throw new Error(`无法编码 CTOS 消息：${pb.msg}`);
  }
  return message.toFullPayload();
}
