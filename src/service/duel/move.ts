import { fetchCard, ygopro } from "@/api";
import { eventbus, Task } from "@/infra";
import { cardStore, CardType } from "@/stores";

import { REASON_MATERIAL } from "../../common";

type MsgMove = ygopro.StocGameMessage.MsgMove;
const { HAND, GRAVE, REMOVED, DECK, EXTRA, MZONE, TZONE } = ygopro.CardZone;

const overlayStack: ygopro.CardLocation[] = [];

export default async (move: MsgMove) => {
  const code = move.code;
  const from = move.from;
  const to = move.to;
  const reason = move.reason;

  const fromCards = cardStore.at(from.zone, from.controler);
  const toCards = cardStore.at(to.zone, to.controler);

  // TODO: 是否能有更solid的衍生物判断方式？
  const fromZone =
    move.from.toArray().at(1) === undefined ? ygopro.CardZone.TZONE : from.zone;
  const toZone =
    move.to.toArray().at(1) === undefined ? ygopro.CardZone.TZONE : to.zone;

  // log出来看看，后期删掉即可
  await (async () => {
    const { text } = await fetchCard(code);
    console.color("green")(
      `${text.name} ${ygopro.CardZone[fromZone]}:${from.sequence}:${
        from.is_overlay ? from.overlay_sequence : ""
      } → ${ygopro.CardZone[toZone]}:${to.sequence}:${
        to.is_overlay ? to.overlay_sequence : ""
      }`
    );
  })();

  let target: CardType;

  // 处理token
  if (fromZone === TZONE) {
    // 召唤 token
    target = cardStore.at(TZONE, from.controler)[0]; // 必有，随便取一个没用到的token
  } else if (from.is_overlay) {
    // 超量素材的去除
    const overlayMaterial = cardStore.at(
      MZONE,
      from.controler,
      from.sequence,
      from.overlay_sequence
    );
    if (overlayMaterial) {
      target = overlayMaterial;
    } else {
      console.warn(
        `<Move>overlayMaterial from zone=${MZONE}, controller=${from.controler}, sequence=${from.sequence}, overlay_sequence=${from.overlay_sequence} is null`
      );
      return;
    }
  } else {
    const card = cardStore.at(fromZone, from.controler, from.sequence);
    if (card) {
      target = card;
    } else {
      console.warn(
        `<Move>card from zone=${fromZone}, controller=${from.controler} sequence=${from.sequence} is null`
      );
      console.info(cardStore.at(fromZone, from.controler));
      return;
    }
  }

  // 超量
  if (to.is_overlay) {
    // 准备超量召唤，超量素材入栈
    if (reason == REASON_MATERIAL) overlayStack.push(to);
  }
  if (toZone === MZONE && overlayStack.length) {
    // 超量召唤
    const xyzLocations = overlayStack.splice(0, overlayStack.length);
    for (const location of xyzLocations) {
      const overlayMaterial = cardStore.at(
        location.zone,
        location.controler,
        location.sequence,
        location.overlay_sequence
      );
      if (overlayMaterial) {
        // 超量素材的位置应该和超量怪兽保持一致
        overlayMaterial.location.controler = to.controler;
        overlayMaterial.location.zone = to.zone;
        overlayMaterial.location.sequence = to.sequence;

        await eventbus.call(Task.Move, overlayMaterial.uuid);
      }
    }
  }

  // 维护sequence
  if ([HAND, GRAVE, REMOVED, DECK, EXTRA].includes(fromZone))
    fromCards.forEach(
      (c) => c.location.sequence > from.sequence && c.location.sequence--
    );
  if ([HAND, GRAVE, REMOVED, DECK, EXTRA].includes(toZone))
    toCards.forEach(
      (c) => c.location.sequence >= to.sequence && c.location.sequence++
    );

  // 更新信息
  target.code = code;
  target.location = to;

  // 维护完了之后，开始动画
  const promises: Promise<unknown>[] = [];
  promises.push(eventbus.call(Task.Move, target.uuid));
  // 如果from或者to是手卡，那么需要刷新除了这张卡之外，这个玩家的所有手卡
  if ([fromZone, toZone].includes(HAND)) {
    cardStore.at(HAND, target.location.controler).forEach((card) => {
      if (card.uuid !== target.uuid)
        promises.push(eventbus.call(Task.Move, card.uuid));
    });
  }
  await Promise.all(promises);

  // 超量素材位置随之移动
  if (from.zone == MZONE && !from.is_overlay) {
    for (const overlay of cardStore.findOverlay(
      from.zone,
      from.controler,
      from.sequence
    )) {
      overlay.location = to;

      await eventbus.call(Task.Move, overlay.uuid);
    }
  }

  // TODO: 如果涉及了有超量素材的怪兽的移动，那么这个怪兽的移动应该也会带动超量素材的移动

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
  // 超量素材(target)是xyzMonster.overlayMaterials[from.overlay_sequence]

  // 在超量召唤/超量素材更改时候，target是超量素材，但同时也要维护超量怪兽的overlayMaterials

  // token登场
  // - token：fromZone === TZONE

  // token离场
  // - token：toZone === TZONE
};
