import { ygopro } from "@/api/ocgcore/idl/ocgcore";
import MsgMove = ygopro.StocGameMessage.MsgMove;
import { fetchBanishedZoneMeta } from "@/reducers/duel/banishedZoneSlice";
import { fetchExtraDeckMeta } from "@/reducers/duel/extraDeckSlice";
import { fetchGraveyardMeta } from "@/reducers/duel/graveyardSlice";
import { insertHandMeta } from "@/reducers/duel/handsSlice";
import { fetchMagicMeta } from "@/reducers/duel/magicSlice";
import {
  removeBanishedZone,
  removeExtraDeck,
  removeGraveyard,
  removeHand,
  removeMagic,
  removeMonster,
  removeOverlay,
} from "@/reducers/duel/mod";
import {
  fetchMonsterMeta,
  fetchOverlayMeta,
} from "@/reducers/duel/monstersSlice";
import { AppDispatch } from "@/store";

import { valtioStore } from "@/valtioStores";

import { REASON_MATERIAL } from "../../common";

const { playMat: playMatStore } = valtioStore.duelStore;

const OVERLAY_STACK: { code: number; sequence: number }[] = [];

export default (move: MsgMove, dispatch: AppDispatch) => {
  const code = move.code;
  const from = move.from;
  const to = move.to;
  const reason = move.reason;

  switch (from.location) {
    case ygopro.CardZone.HAND: {
      dispatch(removeHand([from.controler, from.sequence]));
      playMatStore.hands.remove(from.controler, from.sequence);
      break;
    }
    case ygopro.CardZone.MZONE: {
      dispatch(
        removeMonster({ controler: from.controler, sequence: from.sequence })
      );

      break;
    }
    case ygopro.CardZone.SZONE: {
      dispatch(
        removeMagic({ controler: from.controler, sequence: from.sequence })
      );

      break;
    }
    case ygopro.CardZone.GRAVE: {
      dispatch(
        removeGraveyard({ controler: from.controler, sequence: from.sequence })
      );
      playMatStore.graveyards.remove(from.controler, from.sequence);

      break;
    }
    case ygopro.CardZone.REMOVED: {
      dispatch(
        removeBanishedZone({
          controler: from.controler,
          sequence: from.sequence,
        })
      );
      playMatStore.banishedZones.remove(from.controler, from.sequence);

      break;
    }
    case ygopro.CardZone.EXTRA: {
      dispatch(
        removeExtraDeck({ controler: from.controler, sequence: from.sequence })
      );
      playMatStore.extraDecks.remove(from.controler, from.sequence);

      break;
    }
    case ygopro.CardZone.OVERLAY: {
      dispatch(
        removeOverlay({
          controler: from.controler,
          sequence: from.sequence,
          overlaySequence: from.overlay_sequence,
        })
      );

      break;
    }
    default: {
      console.log(`Unhandled zone type ${from.location}`);
      break;
    }
  }

  switch (to.location) {
    case ygopro.CardZone.MZONE: {
      dispatch(
        fetchMonsterMeta({
          controler: to.controler,
          sequence: to.sequence,
          position: to.position,
          code,
        })
      );

      // 处理超量素材
      const overlayMetarials = OVERLAY_STACK.splice(0, OVERLAY_STACK.length);
      let sorted = overlayMetarials
        .sort((a, b) => a.sequence - b.sequence)
        .map((overlay) => overlay.code);
      dispatch(
        fetchOverlayMeta({
          controler: to.controler,
          sequence: to.sequence,
          overlayCodes: sorted,
        })
      );

      break;
    }
    case ygopro.CardZone.SZONE: {
      dispatch(
        fetchMagicMeta({
          controler: to.controler,
          sequence: to.sequence,
          position: to.position,
          code,
        })
      );

      break;
    }
    case ygopro.CardZone.GRAVE: {
      dispatch(
        fetchGraveyardMeta({
          controler: to.controler,
          sequence: to.sequence,
          code,
        })
      );

      break;
    }
    case ygopro.CardZone.HAND: {
      dispatch(
        insertHandMeta({ controler: to.controler, sequence: to.sequence, code })
      );
      playMatStore.hands.insert(to.controler, to.sequence, code);

      break;
    }
    case ygopro.CardZone.REMOVED: {
      dispatch(
        fetchBanishedZoneMeta({
          controler: to.controler,
          sequence: to.sequence,
          code,
        })
      );

      break;
    }
    case ygopro.CardZone.EXTRA: {
      dispatch(
        fetchExtraDeckMeta({
          controler: to.controler,
          sequence: to.sequence,
          code,
        })
      );

      break;
    }
    case ygopro.CardZone.OVERLAY: {
      if (reason == REASON_MATERIAL) {
        // 超量素材在进行超量召唤时，若玩家未选择超量怪兽的位置，会“沉到决斗盘下面”，`reason`字段值是`REASON_MATERIAL`
        // 这时候将它们放到一个栈中，待超量怪兽的Move消息到来时从栈中获取超量素材补充到状态中
        OVERLAY_STACK.push({ code, sequence: to.overlay_sequence });
      } else {
        // 其他情况下，比如“宵星的机神 丁吉尔苏”的“补充超量素材”效果，直接更新状态中
        dispatch(
          fetchOverlayMeta({
            controler: to.controler,
            sequence: to.sequence,
            overlayCodes: [code],
            append: true,
          })
        );
      }

      break;
    }
    default: {
      console.log(`Unhandled zone type ${to.location}`);

      break;
    }
  }
};
