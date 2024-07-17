import { sendSelectSingleResponse, ygopro } from "@/api";
import { Container } from "@/container";
import { ChainSetting, fetchSelectHintMeta } from "@/stores";
import { displaySelectActionsModal } from "@/ui/Duel/Message/SelectActionsModal";

import { fetchCheckCardMeta } from "../utils";

type MsgSelectChain = ygopro.StocGameMessage.MsgSelectChain;
export default async (container: Container, selectChain: MsgSelectChain) => {
  const conn = container.conn;
  const context = container.context;
  const spCount = selectChain.special_count;
  const forced = selectChain.forced;
  const _hint0 = selectChain.hint0;
  const _hint1 = selectChain.hint1;
  const chains = selectChain.chains;
  const chainSetting = context.matStore.chainSetting;

  if (chainSetting === ChainSetting.CHAIN_IGNORE) {
    // 如果玩家配置了忽略连锁，直接回应后端并返回
    sendSelectSingleResponse(conn, -1);
    return;
  }

  let handle_flag = 0;
  if (!forced) {
    // 无强制发动的卡
    if (spCount === 0) {
      // 无关键卡
      if (chains.length === 0) {
        // 直接回答
        handle_flag = 0;
      } else {
        if (chainSetting === ChainSetting.CHAIN_ALL) {
          // 配置了全部连锁，则处理多张
          handle_flag = 2;
        } else {
          // 否则不连锁
          handle_flag = 0;
        }
      }
    } else {
      // 有关键卡
      if (chains.length === 0) {
        // 根本没卡，直接回答
        handle_flag = 0;
      } else {
        // 处理多张
        handle_flag = 2;
      }
    }
  } else {
    // 有强制发动的卡
    if (chains.length === 1) {
      // 只有一个强制发动的连锁项，直接回应
      handle_flag = 4;
    } else {
      // 处理强制发动的卡
      handle_flag = 3;
    }
  }

  switch (handle_flag) {
    case 0: {
      // 直接回答
      sendSelectSingleResponse(conn, -1);

      break;
    }
    case 2: // 处理多张
    case 3: {
      // 处理强制发动的卡
      fetchSelectHintMeta({
        selectHintData: 203,
      });
      const { selecteds, mustSelects, selectables } = await fetchCheckCardMeta(
        context,
        chains,
      );
      await displaySelectActionsModal({
        isChain: true,
        cancelable: !forced,
        min: 1,
        max: 1,
        selecteds,
        mustSelects,
        selectables,
      });
      break;
    }
    case 4: {
      // 有一张强制发动的卡，直接回应
      sendSelectSingleResponse(conn, chains[0].response);

      break;
    }
    default: {
      console.log(`Unhandled flag: ${handle_flag}`);
    }
  }
};
