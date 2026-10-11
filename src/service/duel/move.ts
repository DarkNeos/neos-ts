import { v4 as v4uuid } from "uuid";

import { fetchCard, ygopro } from "@/api";
import { Container } from "@/container";
import { AudioActionType, playEffect } from "@/infra/audio";
import { CardType } from "@/stores";
import { callCardMove } from "@/ui/Duel/PlayMat/Card";

import { REASON_DESTROY, TYPE_TOKEN } from "../../common";
import { genCard } from "../utils";

type MsgMove = ygopro.StocGameMessage.MsgMove;
const { EMPTY, HAND, GRAVE, REMOVED, DECK, EXTRA, MZONE, SZONE, TZONE } =
  ygopro.CardZone;
const { FACEDOWN, FACEDOWN_ATTACK, FACEDOWN_DEFENSE } = ygopro.CardPosition;

/*
 * 超量素材的位置记录宿主的区域、控制方和序号。
 * 召唤前宿主还在额外卡组，素材也保留这个地址；宿主移动时一起更新。
 * 素材之间的转移由各自的 MSG_MOVE 处理，不随成为素材的旧宿主提前转移。
 *
 * * 衍生物的`Location`
 * - 在neos视角中，衍生物放在`TZONE`区域；
 * - 在ygopro后端视角中，衍生物放在`DECK`区域；
 * - 当衍生物进场和离场的时候，from和to的zone都是`DECK`，因此这里手动修改；
 * - 通过`meta.data.type`判断一张卡是否是衍生物。
 *
 * */
export default async (container: Container, move: MsgMove) => {
  const context = container.context;
  const code = move.code;
  const from = move.from;
  const to = move.to;
  const reason = move.reason;
  const fromEmpty = from.zone === EMPTY;
  const toEmpty = to.zone === EMPTY;

  const meta = fetchCard(code);
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

  if (fromEmpty) {
    target = genCard({
      uuid: v4uuid(),
      code,
      location: to,
      counters: {},
      idleInteractivities: [],
      meta,
      isToken:
        meta.data.type !== undefined && (meta.data.type & TYPE_TOKEN) > 0,
      targeted: false,
      selectInfo: {
        selectable: false,
        selected: false,
      },
      status: 0,
    });
  } else if (from.is_overlay) {
    // 超量素材的去除
    const overlayMaterial = context.cardStore.at(
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
    const card = context.cardStore.at(
      from.zone,
      from.controller,
      from.sequence,
    );
    if (card) {
      target = card;
    } else {
      console.warn(
        `<Move>card from zone=${from.zone}, controller=${from.controller} sequence=${from.sequence} is null`,
      );
      console.info(context.cardStore.at(from.zone, from.controller));
      return;
    }
  }

  // 在更新目标位置前确定附属素材，避免将刚叠放的卡自身误认为附属素材。
  const attachedMaterials =
    !fromEmpty && !from.is_overlay && !to.is_overlay
      ? context.cardStore.findOverlay(from.zone, from.controller, from.sequence)
      : [];

  // 维护sequence
  const fromCards = fromEmpty
    ? []
    : context.cardStore.at(from.zone, from.controller);
  const toCards = toEmpty ? [] : context.cardStore.at(to.zone, to.controller);

  // 卡组等区域的序号变化也会改变仍在该区域的宿主地址。
  const shiftSequences = (cards: CardType[], delta: number) => {
    // 先按旧地址收集所有素材，再统一移动，避免新旧序号重合时匹配到错误宿主。
    const groups = cards.map((card) => ({
      card,
      materials: context.cardStore.findOverlay(
        card.location.zone,
        card.location.controller,
        card.location.sequence,
      ),
    }));
    for (const { card, materials } of groups) {
      card.location.sequence += delta;
      for (const material of materials)
        material.location.sequence = card.location.sequence;
    }
  };
  if (
    !fromEmpty &&
    [HAND, GRAVE, REMOVED, DECK, EXTRA, TZONE].includes(from.zone) &&
    !from.is_overlay
  )
    shiftSequences(
      fromCards.filter((c) => c.location.sequence > from.sequence),
      -1,
    );
  if (
    !toEmpty &&
    !to.is_overlay &&
    [HAND, GRAVE, REMOVED, DECK, EXTRA, TZONE].includes(to.zone)
  )
    shiftSequences(
      toCards.filter((c) => c !== target && c.location.sequence >= to.sequence),
      1,
    );
  if (!fromEmpty && from.is_overlay) {
    // 超量素材的序号也需要维护
    const overlay_sequence = from.overlay_sequence;
    for (const overlay of context.cardStore.findOverlay(
      from.zone,
      from.controller,
      from.sequence,
    )) {
      if (overlay.location.overlay_sequence > overlay_sequence) {
        overlay.location.overlay_sequence--;
      }
    }
  }

  // 消失、身份变为未知或进入牌堆后解除场上连锁编号，列表保留发动时的公开卡号。
  if (toEmpty || code === 0 || [DECK, EXTRA].includes(to.zone)) {
    context.matStore.clearChainBindings([target.uuid]);
  }
  target.hint = undefined;
  if (code === 0 || toEmpty || [DECK, EXTRA].includes(to.zone))
    target.descriptionHints = {};
  if (to.is_overlay && [MZONE, SZONE].includes(to.zone)) {
    const host = context.cardStore.at(to.zone, to.controller, to.sequence);
    if (host) to.position = host.location.position;
  }
  target.code = code;
  // 区域变化、成为或脱离素材、盖放时重置旧状态；同区移位或换控制方保留。
  if (
    !fromEmpty &&
    (from.zone !== to.zone ||
      from.is_overlay !== to.is_overlay ||
      [FACEDOWN, FACEDOWN_ATTACK, FACEDOWN_DEFENSE].includes(to.position))
  )
    context.cardStore.resetFieldState(target);
  target.location = to;
  if (fromEmpty) {
    context.cardStore.inner.push(target);
  }
  if (toEmpty) {
    context.cardStore.inner = context.cardStore.inner.filter(
      (card) => card.uuid !== target.uuid,
    );
    return;
  }
  if (!(from.zone === MZONE && to.zone === MZONE)) {
    // 怪兽区域内移位保留取对象标记，其他移动清除本次对象状态。
    target.targeted = false;
  }

  if (
    (to.zone !== MZONE && to.zone !== SZONE) ||
    (to.zone === MZONE && reason !== 0)
  )
    context.historyStore.putMove(context, code, from, to);

  for (const material of attachedMaterials) {
    material.location.zone = to.zone;
    material.location.controller = to.controller;
    material.location.sequence = to.sequence;
    material.location.position = to.position;
  }

  // 维护完了之后，开始播放音效和动画

  if (to.zone === REMOVED) {
    playEffect(AudioActionType.SOUND_BANISHED);
  } else if (
    (to.zone === MZONE || to.zone === SZONE) &&
    (to.position === FACEDOWN ||
      to.position === FACEDOWN_ATTACK ||
      to.position === FACEDOWN_DEFENSE)
  ) {
    playEffect(AudioActionType.SOUND_SET);
  } else if ((reason & REASON_DESTROY) > 0) {
    playEffect(AudioActionType.SOUND_DESTROYED);
  }

  const overlayAnimation = to.is_overlay
    ? [MZONE, SZONE].includes(to.zone)
      ? "attach"
      : !from.is_overlay
      ? "prepare"
      : undefined
    : undefined;
  const enteringWithMaterials =
    to.zone === MZONE && from.zone !== MZONE && attachedMaterials.length > 0;
  const targetMove = fromEmpty
    ? Promise.resolve()
    : callCardMove(target.uuid, { fromZone: from.zone, overlayAnimation });
  const moveMaterials = () =>
    Promise.all(
      attachedMaterials.map((material) =>
        callCardMove(material.uuid, {
          overlayAnimation: enteringWithMaterials ? "summon" : undefined,
        }),
      ),
    );
  // 先让宿主落场，再让素材一起滑入卡底，避免素材逐张往返或遮住宿主。
  const p = enteringWithMaterials
    ? targetMove.then(moveMaterials)
    : Promise.all([targetMove, moveMaterials()]);
  // 如果from或者to是手卡，那么需要刷新除了这张卡之外，这个玩家的所有手卡
  if ([from.zone, to.zone].includes(HAND)) {
    const pHands = context.cardStore
      .at(HAND, target.location.controller)
      .filter((c) => c.uuid !== target.uuid)
      .map(async (c) => await callCardMove(c.uuid));
    await Promise.all([p, ...pHands]);
  } else {
    await p;
  }
};
