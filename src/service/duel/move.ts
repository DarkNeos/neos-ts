import { v4 as v4uuid } from "uuid";

import { fetchCard, ygopro } from "@/api";
import { fetchOverlayMeta, store, cardStore, CardType } from "@/stores";
type MsgMove = ygopro.StocGameMessage.MsgMove;
import { useConfig } from "@/config";
import { sleep } from "@/infra";

import { REASON_MATERIAL } from "../../common";

const { matStore } = store;
const NeosConfig = useConfig();

const { HAND, GRAVE, REMOVED, DECK, EXTRA, MZONE, SZONE, TZONE, OVERLAY } =
  ygopro.CardZone;

const OVERLAY_STACK: { uuid: string; code: number; sequence: number }[] = [];

const overlayStack: CardType[] = [];

export default async (move: MsgMove) => {
  const code = move.code;
  const from = move.from;
  const to = move.to;
  const reason = move.reason;

  // FIXME: 考虑超量素材的情况

  // FIXME：需要考虑【卡名当作另一张卡】的情况

  let uuid;
  let chainIndex;
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
      chainIndex = target.chainIndex;
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

      if (removed === undefined) {
        console.warn(`remove from matStore return undefined, location=${from}`);
      }

      uuid = removed.uuid;
      chainIndex = removed.chainIndex;

      break;
    }
    // 仅仅去除超量素材
    case ygopro.CardZone.OVERLAY: {
      const target = matStore.monsters.of(from.controler)[from.sequence];
      if (target && target.overlay_materials) {
        target.overlay_materials.splice(from.overlay_sequence, 1);
      }

      // 如果是超量素材的移动，暂时采用妥协的设计，重新生成uuid
      // FIXME: 后续需要正确处理超量素材的移动
      uuid = v4uuid();
      break;
    }
  }

  if (chainIndex) {
    // 如果`chainIndex`不为空，则连锁位置变了，需要更新连锁栈的状态
    matStore.chains[chainIndex - 1] = to;
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
        // 设置UUID
        matStore.in(to.location).of(to.controler)[to.sequence].uuid = uuid;
      }
      // 设置连锁序号
      matStore.in(to.location).of(to.controler)[to.sequence].chainIndex =
        chainIndex;

      await sleep(NeosConfig.ui.moveDelay);
      matStore.setFocus(to, false);
      break;
    }
    case ygopro.CardZone.REMOVED:
    case ygopro.CardZone.GRAVE:
    case ygopro.CardZone.DECK:
    case ygopro.CardZone.EXTRA: {
      if (uuid) {
        matStore
          .in(to.location)
          .of(to.controler)
          .insert(uuid, code, to.sequence, to.position, false, chainIndex);
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
            true,
            chainIndex
          );

        await sleep(NeosConfig.ui.moveDelay);
        matStore.setFocus(to, false);
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

  // card store
  const fromCards = cardStore.at(from.location, from.controler);
  const toCards = cardStore.at(to.location, to.controler);

  const fromZone =
    move.from.toArray()[1] === undefined
      ? ygopro.CardZone.TZONE
      : from.location;
  const toZone =
    move.to.toArray()[1] === undefined ? ygopro.CardZone.TZONE : to.location;

  // log出来看看，后期删掉即可
  (async () => {
    const { text } = await fetchCard(code);
    console.warn(
      "move",
      text.name,
      ygopro.CardZone[fromZone],
      from.sequence,
      "->",
      ygopro.CardZone[toZone],
      to.sequence
    );
    console.warn("overlay", from.overlay_sequence, to.overlay_sequence);
  })();

  let target: CardType;

  // 处理token
  if (fromZone === TZONE) {
    // 召唤 token
    target = cardStore.at(TZONE, from.controler)[0]; // 必有，随便取一个没用到的token
  } else if (fromZone === OVERLAY) {
    // 超量素材的去除
    const xyzMoster = cardStore.at(MZONE, from.controler, from.sequence);
    target = xyzMoster.overlayMaterials.splice(from.overlay_sequence, 1)[0];
    target.xyzMonster = undefined;
  } else {
    target = cardStore.at(fromZone, from.controler, from.sequence);
  }

  // 超量
  if (toZone === OVERLAY) {
    // 准备超量召唤，超量素材入栈
    if (reason == REASON_MATERIAL) overlayStack.push(target);
    // 超量素材的添加
    else {
      target.overlayMaterials.splice(to.overlay_sequence, 0, target);
      target.xyzMonster = undefined;
    }
  }
  if (toZone === MZONE && overlayStack.length) {
    // 超量召唤
    target.overlayMaterials = overlayStack.splice(0, overlayStack.length);
    target.overlayMaterials.forEach((c) => (c.xyzMonster = target));
  }

  // 维护sequence
  if ([HAND, GRAVE, REMOVED, DECK, EXTRA].includes(fromZone))
    fromCards.forEach((c) => c.sequence > from.sequence && c.sequence--);
  if ([HAND, GRAVE, REMOVED, DECK, EXTRA].includes(toZone))
    toCards.forEach((c) => c.sequence >= to.sequence && c.sequence++);

  // 更新信息
  target.zone = toZone;
  target.controller = to.controler;
  target.sequence = to.sequence;
  target.code = code;
  target.position = to.position;

  // 维护完了之后，开始动画
  eventBus.emit(Report.Move, target.uuid);
  // 如果from或者to是手卡，那么需要刷新除了这张卡之外，这个玩家的所有手卡
  if ([fromZone, toZone].includes(HAND)) {
    cardStore.at(HAND, target.controller).forEach((card) => {
      if (card.uuid !== target.uuid) eventBus.emit(Report.Move, card.uuid);
    });
  }

  // 注意，一个monster的overlayMaterials中的每一项都是一个cardType，
  // 并且，overlayMaterials的idx就是超量素材的sequence。
  // 如果一个card的zone是OVERLAY，那么它本身的sequence项是无意义的。

  // 超量召唤:
  // - 超量素材：toZone === OVERLAY, reason === REASON_MATERIAL
  // - 超量怪兽：toZone === MZONE
  // 解决方法是将超量素材放到一个list之中，等待超量怪兽的Move消息到来时从list中获取超量素材补充到超量怪兽的素材中

  // 超量怪兽增加超量素材
  // - 超量素材：toZone === OVERLAY, reason !== REASON_MATERIAL
  // 这里要注意toZone和toSequence的不一致
  // 超量素材(target)是cardStore.at(from.location, from.controler, from.sequence)
  // 超量怪兽(xyzMonster)是cardStore.at(MZONE, to.controler, to.sequence)

  // 超量怪兽失去超量素材
  // - 超量素材：fromZone === OVERLAY
  // 超量怪兽(xyzMonster)是cardStore.at(MZONE, from.controler, from.sequence)
  // 超量素材(target)是xyzMoster.overlayMaterials[from.overlay_sequence]

  // 在超量召唤/超量素材更改时候，target是超量素材，但同时也要维护超量怪兽的overlayMaterials

  // token登场
  // - token：fromZone === TZONE

  // token离场
  // - token：toZone === TZONE
};
