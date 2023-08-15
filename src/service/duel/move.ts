import { fetchCard, ygopro } from "@/api";
import { cardStore, CardType } from "@/stores";
import { callCardMove } from "@/ui/Duel/PlayMat/Card";

import { REASON_MATERIAL, TYPE_TOKEN } from "../../common";

type MsgMove = ygopro.StocGameMessage.MsgMove;
const { HAND, GRAVE, REMOVED, DECK, EXTRA, MZONE, TZONE } = ygopro.CardZone;

const overlayStack: ygopro.CardLocation[] = [];

/*
 * * 超量素材的`Location`：
 * - 位置是跟随超量怪兽的，通过`is_overlay`字段判断是否是超量素材，`overlay_sequence`是在某个超量怪兽下面的超量序列；
 * - 超量怪兽移动，超量素材需要跟着移动，并且需要前端自己维护这个关系，因为当超量怪兽移动时，
 *   后端不会针对超量素材传`MSG_MOVE`；
 * - 某个超量怪兽下面的超量素材的`overlay_sequence`也需要前端自己维护；
 * - 当进行超量召唤时，超量素材会临时移动到某个位置，玩家选择完超量怪兽的位置后，超量怪兽会从`EXTRA ZONE`
 *   move到`MZONE`，这之后超量素材应该移动到超量怪兽的位置，但是后端会传这部分的`MSG_MOVE`信息，
 *   因此前端需要自己维护，现在的做法采用了`入栈-出栈`的方式。
 * - 当场上的超量怪兽离开`MZONE`，比如送墓/除外时，超量素材会跟着超量怪兽移动，这时候它们的`sequence`还是一样的，
 *   然后后端会传`MSG_MOVE`，对超量素材的位置进行修正。
 *
 * * 衍生物的`Location`
 * - 在neos视角中，衍生物放在`TZONE`区域；
 * - 在ygopro后端视角中，衍生物放在`DECK`区域；
 * - 当衍生物进场和离场的时候，from和to的zone都是`DECK`，因此这里手动修改；
 * - 通过`meta.data.type`判断一张卡是否是衍生物。
 *
 * */
export default async (move: MsgMove) => {
  const code = move.code;
  const from = move.from;
  const to = move.to;
  const reason = move.reason;

  const meta = await fetchCard(code);
  if (meta.data.type !== undefined && (meta.data.type & TYPE_TOKEN) > 0) {
    // 衍生物
    if (from.zone === DECK) {
      // 衍生物出场的场景，设置`from.zone`为`TZONE`
      from.zone = TZONE;
    }
    if (to.zone === DECK) {
      // 衍生物离开场上的场合，设置`to.zone`为`TZONE`
      to.zone = TZONE;
    }
  }

  // log出来看看
  console.color("green")(
    `${meta.text.name} ${ygopro.CardZone[from.zone]}:${from.sequence}${
      from.is_overlay ? ":" + from.overlay_sequence : ""
    } → ${ygopro.CardZone[to.zone]}:${to.sequence}${
      to.is_overlay ? ":" + to.overlay_sequence : ""
    }`,
  );

  let target: CardType;

  if (from.is_overlay) {
    // 超量素材的去除
    const overlayMaterial = cardStore.at(
      from.zone,
      from.controller,
      from.sequence,
      from.overlay_sequence,
    );
    if (overlayMaterial) {
      target = overlayMaterial;
    } else {
      console.warn(
        `<Move>overlayMaterial from zone=${from.zone}, controller=${from.controller},
          sequence=${from.sequence}, overlay_sequence=${from.overlay_sequence} is null`,
      );
      return;
    }
  } else {
    const card = cardStore.at(from.zone, from.controller, from.sequence);
    if (card) {
      target = card;
    } else {
      console.warn(
        `<Move>card from zone=${from.zone}, controller=${from.controller} sequence=${from.sequence} is null`,
      );
      console.info(cardStore.at(from.zone, from.controller));
      return;
    }
  }

  // 超量
  if (to.is_overlay && from.zone === MZONE) {
    // 准备超量召唤，超量素材入栈
    if (reason === REASON_MATERIAL) {
      to.zone = MZONE;
      overlayStack.push(to);
    }
  } else if (to.zone === MZONE && overlayStack.length) {
    // 超量召唤
    console.color("grey")(`超量召唤！overlayStack=${overlayStack}`);

    // 超量素材出栈
    const xyzLocations = overlayStack.splice(0, overlayStack.length);
    for (const location of xyzLocations) {
      const overlayMaterial = cardStore.at(
        location.zone,
        location.controller,
        location.sequence,
        location.overlay_sequence,
      );
      if (overlayMaterial) {
        // 超量素材的位置应该和超量怪兽保持一致
        overlayMaterial.location.controller = to.controller;
        overlayMaterial.location.zone = to.zone;
        overlayMaterial.location.sequence = to.sequence;

        await callCardMove(overlayMaterial.uuid);
      } else {
        console.warn(
          `<Move>overlayMaterial from zone=${location.zone}, controller=${location.controller}, sequence=${location.sequence}, overlay_sequence=${location.overlay_sequence} is null`,
        );
      }
    }
  }

  // 维护sequence
  const fromCards = cardStore.at(from.zone, from.controller);
  const toCards = cardStore.at(to.zone, to.controller);

  if (
    [HAND, GRAVE, REMOVED, DECK, EXTRA, TZONE].includes(from.zone) &&
    !from.is_overlay
  )
    fromCards.forEach(
      (c) => c.location.sequence > from.sequence && c.location.sequence--,
    );
  if ([HAND, GRAVE, REMOVED, DECK, EXTRA, TZONE].includes(to.zone))
    toCards.forEach(
      (c) => c.location.sequence >= to.sequence && c.location.sequence++,
    );
  if (from.is_overlay) {
    // 超量素材的序号也需要维护
    const overlay_sequence = from.overlay_sequence;
    for (const overlay of cardStore.findOverlay(
      from.zone,
      from.controller,
      from.sequence,
    )) {
      if (overlay.location.overlay_sequence > overlay_sequence) {
        overlay.location.overlay_sequence--;
      }
    }
  }

  // 更新信息
  target.code = code;
  target.location = to;

  // 维护完了之后，开始动画
  const p = callCardMove(target.uuid, { fromZone: from.zone });
  // 如果from或者to是手卡，那么需要刷新除了这张卡之外，这个玩家的所有手卡
  if ([from.zone, to.zone].includes(HAND)) {
    const pHands = cardStore
      .at(HAND, target.location.controller)
      .filter((c) => c.uuid !== target.uuid)
      .map(async (c) => await callCardMove(c.uuid));
    await Promise.all([p, ...pHands]);
  } else {
    await p;
  }

  // 超量素材位置跟随超量怪兽移动
  if (from.zone === MZONE && !from.is_overlay) {
    for (const overlay of cardStore.findOverlay(
      from.zone,
      from.controller,
      from.sequence,
    )) {
      overlay.location.zone = to.zone;
      overlay.location.controller = to.controller;
      overlay.location.sequence = to.sequence;
      overlay.location.position = to.position;

      await callCardMove(overlay.uuid);
    }
  }
};
