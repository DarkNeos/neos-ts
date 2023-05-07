import { sendSelectChainResponse, ygopro } from "@/api";
import {
  fetchCheckCardMeta,
  fetchSelectHintMeta,
  messageStore,
} from "@/stores";

type MsgSelectChain = ygopro.StocGameMessage.MsgSelectChain;
export default (selectChain: MsgSelectChain) => {
  const spCount = selectChain.special_count;
  const forced = selectChain.forced;
  const hint0 = selectChain.hint0;
  const hint1 = selectChain.hint1;
  const chains = selectChain.chains;

  let handle_flag = 0;
  if (!forced) {
    // 无强制发动的卡
    if (spCount == 0) {
      // 无关键卡
      if (chains.length == 0) {
        // 直接回答
        handle_flag = 0;
      } else {
        // 处理多张
        handle_flag = 2;
      }
    } else {
      // 有关键卡
      if (chains.length == 0) {
        // 根本没卡，直接回答
        handle_flag = 0;
      } else {
        // 处理多张
        handle_flag = 2;
      }
    }
  } else {
    // 有强制发动的卡
    if (chains.length == 1) {
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
      sendSelectChainResponse(-1);

      break;
    }
    case 2: // 处理多张
    case 3: {
      // 处理强制发动的卡

      messageStore.selectCardActions.min = 1;
      messageStore.selectCardActions.max = 1;
      messageStore.selectCardActions.cancelAble = !forced;

      for (const chain of chains) {
        fetchCheckCardMeta({
          code: chain.code,
          location: chain.location,
          response: chain.response,
          effectDescCode: chain.effect_description,
        });
      }
      fetchSelectHintMeta({
        selectHintData: 203,
      });
      messageStore.selectCardActions.isOpen = true;

      break;
    }
    case 4: {
      // 有一张强制发动的卡，直接回应
      sendSelectChainResponse(chains[0].response);

      break;
    }
    default: {
      console.log(`Unhandled flag: ${handle_flag}`);
    }
  }
};
