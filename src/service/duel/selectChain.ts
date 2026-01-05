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
  const _hint0 = selectChain.hint0;
  const _hint1 = selectChain.hint1;
  const chains = selectChain.chains;
  const chainSetting = context.matStore.chainSetting;

  // 计算强制发动的卡片数量
  const forceCount = chains.filter((chain) => (chain as any).forced).length;

  if (chainSetting === ChainSetting.CHAIN_IGNORE && forceCount === 0) {
    // 如果玩家配置了忽略连锁，且没有强制发动的卡，直接回应后端并返回
    sendSelectSingleResponse(conn, -1);
    return;
  }

  let handle_flag = 0;
  if (forceCount === 0) {
    // 无强制发动的卡
    if (spCount === 0) {
      // 无关键卡
      if (chains.length === 0) {
        // 直接回答
        handle_flag = 0;
      } else {
        if (chainSetting === ChainSetting.CHAIN_ALL) {
          // 配置了全部连锁，则处理
          if (chains.length === 1) {
            handle_flag = 1;
          } else {
            handle_flag = 2;
          }
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
      } else if (chainSetting === ChainSetting.CHAIN_IGNORE) {
        // 配置了忽略连锁
        handle_flag = 0;
      } else {
        // 处理
        if (chains.length === 1) {
          handle_flag = 1;
        } else {
          handle_flag = 2;
        }
      }
    }
  } else {
    // 有强制发动的卡
    if (chains.length === 1) {
      // 只有一张卡需要处理（强制发动）
      handle_flag = 3;
    } else {
      // 多张卡需要处理（强制发动）
      handle_flag = 4;
    }
  }

  // handle_flag:
  // 0 - 无卡，直接回应
  // 1 - 一张卡需要处理
  // 2 - 多张卡需要处理
  // 3 - 一张卡需要处理（强制发动）
  // 4 - 多张卡需要处理（强制发动）

  switch (handle_flag) {
    case 0: {
      // 直接回答
      sendSelectSingleResponse(conn, -1);
      break;
    }
    case 1:
    case 2: {
      // 处理可选连锁
      fetchSelectHintMeta({
        selectHintData: 203,
      });
      const { selecteds, mustSelects, selectables } = await fetchCheckCardMeta(
        context,
        chains,
      );
      await displaySelectActionsModal({
        isChain: true,
        cancelable: true,
        min: 1,
        max: 1,
        selecteds,
        mustSelects,
        selectables,
      });
      break;
    }
    case 3: {
      // 一张强制发动的卡，直接回应
      sendSelectSingleResponse(conn, chains[0].response);
      break;
    }
    case 4: {
      // 多张强制发动的卡，弹窗选择
      fetchSelectHintMeta({
        selectHintData: 203,
      });
      const { selecteds, mustSelects, selectables } = await fetchCheckCardMeta(
        context,
        chains,
      );
      await displaySelectActionsModal({
        isChain: true,
        cancelable: false,
        min: 1,
        max: 1,
        selecteds,
        mustSelects,
        selectables,
      });
      break;
    }
    default: {
      console.log(`Unhandled flag: ${handle_flag}`);
    }
  }
};
