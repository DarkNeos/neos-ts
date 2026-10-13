import { fetchCard, getStrings, ygopro } from "@/api";
import { hintZones, maskHintText } from "@/api/duelHints";
import { fetchCommonHintMeta, fetchSelectHintMeta } from "@/stores";
import { showCardModal } from "@/ui/Duel/Message/CardModal";
import { callCardFocus } from "@/ui/Duel/PlayMat/Card";

import MsgHint = ygopro.StocGameMessage.MsgHint;
import { Container } from "@/container";

import { fetchEsHintMeta } from "./util";

export default async (container: Container, hint: MsgHint) => {
  const { context } = container;
  const record = (text: string, code = 0) => {
    context.matStore.hint.esHint = `${
      context.matStore.isMe(hint.player) ? "我方" : "对方"
    }${text}`;
    context.historyStore.putHint(context, hint.player, text, code);
  };
  switch (hint.hint_type) {
    case MsgHint.HintType.HINT_EVENT: {
      await fetchEsHintMeta({
        context: container.context,
        originMsg: hint.hint_data,
      });
      break;
    }
    case MsgHint.HintType.HINT_MESSAGE: {
      fetchCommonHintMeta(hint.hint_data);
      break;
    }
    case MsgHint.HintType.HINT_SELECTMSG: {
      fetchSelectHintMeta({
        selectHintData: hint.hint_data,
        esHint: "",
      });
      break;
    }
    case MsgHint.HintType.HINT_OPSELECTED:
      record(`选择效果：${getStrings(hint.hint_data)}`);
      break;
    case MsgHint.HintType.HINT_RACE:
      record(`宣言种族：${maskHintText(hint.hint_data, "race")}`);
      break;
    case MsgHint.HintType.HINT_ATTRIB:
      record(`宣言属性：${maskHintText(hint.hint_data, "attribute")}`);
      break;
    case MsgHint.HintType.HINT_CODE:
      record(
        `宣言卡名：${fetchCard(hint.hint_data).text.name || hint.hint_data}`,
        hint.hint_data,
      );
      break;
    case MsgHint.HintType.HINT_NUMBER:
      record(`宣言数字：${hint.hint_data}`);
      break;
    case MsgHint.HintType.HINT_EFFECT:
    case MsgHint.HintType.HINT_CARD: {
      const meta = fetchCard(hint.hint_data);
      record(`展示卡片：${meta.text.name || hint.hint_data}`, hint.hint_data);
      showCardModal({ meta });
      const card = context.cardStore.inner.find(
        (card) => card.code === hint.hint_data,
      );
      if (card) await callCardFocus(card.uuid);
      break;
    }
    case MsgHint.HintType.HINT_ZONE: {
      const locations = hintZones(hint.hint_data, hint.player).filter(
        (location, _, all) =>
          location.zone !== ygopro.CardZone.MZONE ||
          location.sequence < 5 ||
          context.matStore.isMe(location.controller) ||
          !all.some(
            (other) =>
              other.zone === location.zone &&
              other.controller !== location.controller &&
              other.sequence === 11 - location.sequence,
          ),
      );
      context.matStore.hint.zones = locations;
      context.matStore.hint.zoneHintAt = Date.now();
      const zones = locations.map(({ controller, zone, sequence }) => {
        const side = context.matStore.isMe(controller) ? "我方" : "对方";
        const name =
          zone === ygopro.CardZone.MZONE
            ? sequence < 5
              ? `怪兽区 ${sequence + 1}`
              : `额外怪兽区 ${sequence - 4}`
            : sequence < 5
            ? `魔陷区 ${sequence + 1}`
            : sequence === 5
            ? "场地区"
            : `灵摆区 ${sequence - 5}`;
        return `${side}${name}`;
      });
      if (zones.length) record(`选择区域：${zones.join("、")}`);
      break;
    }
    default: {
      console.log(`Unhandled hint type ${MsgHint.HintType[hint.hint_type]}`);
    }
  }
};
