import { v4 as v4uuid } from "uuid";

import { ygopro } from "@/api";
import { fetchOverlayMeta, store } from "@/stores";
type MsgMove = ygopro.StocGameMessage.MsgMove;

import { REASON_MATERIAL } from "../../common";

const { matStore } = store;

const OVERLAY_STACK: { uuid: string; code: number; sequence: number }[] = [];

export default (move: MsgMove) => {
  const code = move.code;
  const from = move.from;
  const to = move.to;
  const reason = move.reason;

  // FIXME: 考虑超量素材的情况

  let uuid;
  switch (from.location) {
    case ygopro.CardZone.MZONE:
    case ygopro.CardZone.SZONE: {
      // 魔陷和怪兽需要清掉占用、清掉超量素材
      const target = matStore.in(from.location).of(from.controler)[
        from.sequence
      ];
      target.occupant = undefined;
      target.overlay_materials = [];
      uuid = target.uuid;
      // 需要重新分配UUID
      target.uuid = v4uuid();
      break;
    }
    case ygopro.CardZone.REMOVED:
    case ygopro.CardZone.GRAVE:
    case ygopro.CardZone.HAND:
    case ygopro.CardZone.DECK:
    case ygopro.CardZone.EXTRA: {
      // 其余区域就是在list删掉这张卡
      const removed = matStore
        .in(from.location)
        .of(from.controler)
        .remove(from.sequence);
      uuid = removed.uuid;

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
  }

  switch (to.location) {
    // @ts-ignore
    case ygopro.CardZone.MZONE: {
      // 设置超量素材
      const overlayMetarials = OVERLAY_STACK.splice(0, OVERLAY_STACK.length);
      const sorted = overlayMetarials
        .sort((a, b) => a.sequence - b.sequence)
        .map((overlay) => overlay.code);
      fetchOverlayMeta(to.controler, to.sequence, sorted);
      // 设置Occupant，和魔陷区/其他区共用一个逻辑，特地不写break
    }
    case ygopro.CardZone.SZONE: {
      matStore
        .in(to.location)
        .of(to.controler)
        .setOccupant(to.sequence, code, to.position, true);
      if (uuid) {
        matStore.in(to.location).of(to.controler)[to.sequence].uuid = uuid;
      }

      setTimeout(
        () =>
          (matStore.in(to.location).of(to.controler)[to.sequence].focus =
            false),
        500 // TODO: use config
      );
      break;
    }
    case ygopro.CardZone.REMOVED:
    case ygopro.CardZone.GRAVE:
    case ygopro.CardZone.EXTRA: {
      if (uuid) {
        matStore
          .in(to.location)
          .of(to.controler)
          .insert(uuid, code, to.sequence, to.position);
      }
      break;
    }
    case ygopro.CardZone.HAND: {
      if (uuid) {
        matStore
          .in(to.location)
          .of(to.controler)
          .insert(
            uuid,
            code,
            to.sequence,
            ygopro.CardPosition.FACEUP_ATTACK,
            true
          );

        setTimeout(
          () =>
            (matStore.in(to.location).of(to.controler)[to.sequence].focus =
              false),
          200
        );
      }
      break;
    }
    case ygopro.CardZone.OVERLAY: {
      if (reason == REASON_MATERIAL && uuid) {
        // 超量素材在进行超量召唤时，若玩家未选择超量怪兽的位置，会“沉到决斗盘下面”，`reason`字段值是`REASON_MATERIAL`
        // 这时候将它们放到一个栈中，待超量怪兽的Move消息到来时从栈中获取超量素材补充到状态中
        OVERLAY_STACK.push({ uuid, code, sequence: to.overlay_sequence });
      } else {
        // 其他情况下，比如“宵星的机神 丁吉尔苏”的“补充超量素材”效果，直接更新状态中
        fetchOverlayMeta(to.controler, to.sequence, [code], true);
      }
      break;
    }
    default: {
      console.log(`Unhandled zone type ${to.location}`);
      break;
    }
  }
};
