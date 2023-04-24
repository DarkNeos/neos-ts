import { ygopro } from "@/api";
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
import {
  valtioStore,
  fetchOverlayMeta as FIXME_fetchOverlayMeta,
} from "@/valtioStores";

import { REASON_MATERIAL } from "../../common";

const { matStore } = valtioStore;

const OVERLAY_STACK: { code: number; sequence: number }[] = [];

export default (move: MsgMove, dispatch: AppDispatch) => {
  const code = move.code;
  const from = move.from;
  const to = move.to;
  const reason = move.reason;

  // TODO: 如果后面做动画的话，要考虑DECK的情况。
  // 现在不会对DECK做判断

  switch (from.location) {
    case ygopro.CardZone.MZONE:
    case ygopro.CardZone.SZONE: {
      // 魔陷和怪兽需要清掉占用、清掉超量素材
      const target = matStore.in(from.location).of(from.controler)[
        from.sequence
      ];
      target.occupant = undefined;
      target.overlay_materials = [];
      break;
    }
    case ygopro.CardZone.REMOVED:
    case ygopro.CardZone.GRAVE:
    case ygopro.CardZone.HAND:
    case ygopro.CardZone.EXTRA: {
      // 其余区域就是在list删掉这张卡
      matStore.in(from.location).remove(from.controler, from.sequence);
      break;
    }
    // 仅仅去除超量素材
    case ygopro.CardZone.OVERLAY: {
      const target = matStore.monsters.of(from.controler)[from.sequence];
      if (target && target.overlay_materials) {
        target.overlay_materials.splice(from.overlay_sequence, 1);
      }
      break;
    }
    default: {
      console.log(`Unhandled zone type ${from.location}`);
      break;
    }
  }

  switch (to.location) {
    // @ts-ignore
    case ygopro.CardZone.MZONE: {
      // 设置超量素材
      const overlayMetarials = OVERLAY_STACK.splice(0, OVERLAY_STACK.length);
      const sorted = overlayMetarials
        .sort((a, b) => a.sequence - b.sequence)
        .map((overlay) => overlay.code);
      FIXME_fetchOverlayMeta(to.controler, to.sequence, sorted);
      // 设置Occupant，和魔陷区/其他区共用一个逻辑，特地不写break
    }
    case ygopro.CardZone.SZONE: {
      matStore
        .in(to.location)
        .setOccupant(to.controler, to.sequence, code, to.position);
      break;
    }
    case ygopro.CardZone.REMOVED:
    case ygopro.CardZone.GRAVE:
    case ygopro.CardZone.EXTRA:
    case ygopro.CardZone.HAND: {
      matStore.hands.insert(to.controler, to.sequence, code);
      break;
    }
    case ygopro.CardZone.OVERLAY: {
      if (reason == REASON_MATERIAL) {
        // 超量素材在进行超量召唤时，若玩家未选择超量怪兽的位置，会“沉到决斗盘下面”，`reason`字段值是`REASON_MATERIAL`
        // 这时候将它们放到一个栈中，待超量怪兽的Move消息到来时从栈中获取超量素材补充到状态中
        OVERLAY_STACK.push({ code, sequence: to.overlay_sequence });
      } else {
        // 其他情况下，比如“宵星的机神 丁吉尔苏”的“补充超量素材”效果，直接更新状态中
        FIXME_fetchOverlayMeta(to.controler, to.sequence, [code], true);
      }
      break;
    }
    default: {
      console.log(`Unhandled zone type ${to.location}`);
      break;
    }
  }

  switch (from.location) {
    case ygopro.CardZone.HAND: {
      dispatch(removeHand([from.controler, from.sequence]));
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
      break;
    }
    case ygopro.CardZone.REMOVED: {
      dispatch(
        removeBanishedZone({
          controler: from.controler,
          sequence: from.sequence,
        })
      );
      break;
    }
    case ygopro.CardZone.EXTRA: {
      dispatch(
        removeExtraDeck({ controler: from.controler, sequence: from.sequence })
      );
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
