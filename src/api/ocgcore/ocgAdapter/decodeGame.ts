import * as wire from "ygopro-msg-encode";

import { ygopro } from "../idl/ocgcore";
import type { DuelEvent, DuelGameMessage } from "./duelEvent";
import { decodeHand } from "./handType";
import legacyDeck from "./stoc/stocGameMsg/deck";
import legacyNames from "./stoc/stocGameMsg/sibylName";
import {
  numberToCardPosition,
  numberToCardZone,
  numberToChainFlag,
} from "./util";

import G = ygopro.StocGameMessage;
type GameFields = Exclude<
  NonNullable<ConstructorParameters<typeof G>[0]>,
  any[]
> & { duelEvent?: DuelEvent };
interface WireLocation {
  controller: number;
  location: number;
  sequence: number;
  position?: number;
  subsequence?: number;
}

export function cardLocation(card: WireLocation): ygopro.CardLocation {
  const overlay = (card.location & 0x80) !== 0;
  return new ygopro.CardLocation({
    controller: card.controller,
    zone: numberToCardZone(card.location & ~0x80),
    sequence: card.sequence,
    is_overlay: overlay,
    overlay_sequence: overlay
      ? card.subsequence ?? card.position ?? 0
      : undefined,
    position: overlay
      ? undefined
      : numberToCardPosition(card.position ?? card.subsequence ?? 0),
  });
}

function cardInfo(card: WireLocation & { code: number }) {
  return new ygopro.CardInfo({
    code: card.code,
    controller: card.controller,
    location: numberToCardZone(card.location),
    sequence: card.sequence,
  });
}

function packedLocation(card?: wire.CardQuery_CardLocation) {
  return card
    ? card.controller |
        (card.location << 8) |
        (card.sequence << 16) |
        (card.position << 24)
    : -1;
}

export function queryAction(card: wire.CardQuery): G.MsgUpdateData.Action {
  if (!card.flags)
    return Object.assign(new G.MsgUpdateData.Action({}), { clear: true });
  const action = new G.MsgUpdateData.Action({
    code: card.code ?? -1,
    location:
      card.controller === undefined
        ? undefined
        : cardLocation({
            controller: card.controller,
            location: card.location ?? 0,
            sequence: card.sequence ?? 0,
            position: card.position,
          }),
    alias: card.alias ?? -1,
    type_: card.type ?? -1,
    level: card.level ?? -1,
    rank: card.rank ?? -1,
    attribute: card.attribute ?? -1,
    race: card.race ?? -1,
    attack: card.attack ?? -1,
    defense: card.defense ?? -1,
    base_attack: card.baseAttack ?? -1,
    base_defense: card.baseDefense ?? -1,
    reason: card.reason ?? -1,
    reason_card: packedLocation(card.reasonCard),
    equip_card: card.equipCard && cardLocation(card.equipCard),
    target_cards: card.targetCards?.map(cardLocation) ?? [],
    overlay_cards: card.overlayCards ?? [],
    counters: new Map(card.counters?.map(({ type, count }) => [type, count])),
    owner: card.owner ?? -1,
    status: card.status ?? -1,
    lscale: card.lscale ?? -1,
    rscale: card.rscale ?? -1,
    link: card.link ?? -1,
  });
  return Object.assign(action, {
    queryFlags: card.flags,
    updatesPosition: (card.flags & 2) !== 0,
    linkMarkers: card.linkMarker,
  });
}

function queryUpdate(
  player: number,
  location: number,
  cards: wire.CardQuery[],
  firstSequence = 0,
) {
  const zone = numberToCardZone(location);
  return new G.MsgUpdateData({
    player,
    zone,
    actions: cards.flatMap((card, index) => {
      // 四字节占位表示没有本次更新，八字节 flags=0 才是清除空位。
      if (card.queryLength === 4) return [];
      const action = queryAction(card);
      action.location ??= new ygopro.CardLocation({});
      action.location.controller = player;
      if (zone !== undefined) action.location.zone = zone;
      action.location.sequence = firstSequence + index;
      return [action];
    }),
  });
}

const decoders = new Map<number, (data: Uint8Array) => GameFields>();
function register<T extends { new (): wire.YGOProMsgBase; identifier: number }>(
  Type: T,
  convert: (message: InstanceType<T>) => GameFields,
) {
  decoders.set(Type.identifier, (data) =>
    convert(new Type().fromPayload(data) as InstanceType<T>),
  );
}

register(wire.YGOProMsgStart, (m) => ({
  start: new G.MsgStart({
    playerType:
      m.playerType & 0xf0
        ? G.MsgStart.PlayerType.Observer
        : m.playerType & 0xf
        ? G.MsgStart.PlayerType.SecondStrike
        : G.MsgStart.PlayerType.FirstStrike,
    life1: m.startLp0,
    life2: m.startLp1,
    deckSize1: m.player0.deckCount,
    extraSize1: m.player0.extraCount,
    deckSize2: m.player1.deckCount,
    extraSize2: m.player1.extraCount,
  }),
}));
register(wire.YGOProMsgUpdateData, (m) => ({
  update_data: queryUpdate(m.player, m.location, m.cards),
}));
register(wire.YGOProMsgUpdateCard, (m) => ({
  update_data: queryUpdate(m.controller, m.location, [m.card], m.sequence),
}));
register(wire.YGOProMsgMove, (m) => ({
  move: new G.MsgMove({
    code: m.code,
    from: cardLocation(m.previous),
    to: cardLocation(m.current),
    reason: m.reason,
  }),
}));
register(wire.YGOProMsgPosChange, (m) => ({
  pos_change: new G.MsgPosChange({
    card_info: cardInfo({ ...m.card, code: m.code }),
    pre_position: numberToCardPosition(m.previousPosition),
    cur_position: numberToCardPosition(m.currentPosition),
  }),
}));
register(wire.YGOProMsgSet, (m) => ({
  set: new G.MsgSet({ code: m.code, location: cardLocation(m) }),
}));
register(wire.YGOProMsgSwap, (m) => ({
  swap: new G.MsgSwap({
    code1: m.code1,
    location1: cardLocation(m.card1),
    code2: m.code2,
    location2: cardLocation(m.card2),
  }),
}));
register(wire.YGOProMsgSummoning, (m) => ({
  summoning: new G.MsgSummoning({ code: m.code, location: cardLocation(m) }),
}));
register(wire.YGOProMsgSpSummoning, (m) => ({
  sp_summoning: new G.MsgSpSummoning({
    code: m.code,
    location: cardLocation(m),
  }),
}));
register(wire.YGOProMsgFlipSummoning, (m) => ({
  flip_summoning: new G.MsgFlipSummoning({
    code: m.code,
    location: cardLocation(m),
  }),
}));
register(wire.YGOProMsgSummoned, () => ({ summoned: new G.MsgSummoned({}) }));
register(wire.YGOProMsgSpSummoned, () => ({
  sp_summoned: new G.MsgSpSummoned({}),
}));
register(wire.YGOProMsgFlipSummoned, () => ({
  flip_summoned: new G.MsgFlipSummoned({}),
}));
register(wire.YGOProMsgChaining, (m) => ({
  chaining: new G.MsgChaining({ code: m.code, location: cardLocation(m) }),
}));
register(wire.YGOProMsgChainSolved, (m) => ({
  chain_solved: new G.MsgChainSolved({ solved_index: m.chainCount }),
}));
register(wire.YGOProMsgChainEnd, () => ({ chain_end: new G.MsgChainEnd({}) }));
register(wire.YGOProMsgAttackDisabled, () => ({
  attack_disable: new G.MsgAttackDisabled({}),
}));
register(wire.YGOProMsgLpUpdate, (m) => ({
  lp_update: new G.MsgLpUpdate({ player: m.player, new_lp: m.lp }),
}));
register(wire.YGOProMsgShuffleDeck, (m) => ({
  shuffle_deck: new G.MsgShuffleDeck({ player: m.player }),
}));
register(wire.YGOProMsgSwapGraveDeck, (m) => ({
  swap_grave_deck: new G.MsgSwapGraveDeck({ player: m.player }),
}));
register(wire.YGOProMsgRockPaperScissors, (m) => ({
  rock_paper_scissors: new G.MsgRockPaperScissors({ player: m.player }),
}));
register(wire.YGOProMsgBecomeTarget, (m) => ({
  become_target: new G.MsgBecomeTarget({
    locations: m.targets.map((value) =>
      cardLocation({
        controller: value & 0xff,
        location: (value >>> 8) & 0xff,
        sequence: (value >>> 16) & 0xff,
        position: value >>> 24,
      }),
    ),
  }),
}));
register(wire.YGOProMsgDraw, (m) => ({
  draw: new G.MsgDraw({ player: m.player, count: m.count, cards: m.cards }),
}));
register(wire.YGOProMsgNewTurn, (m) => ({
  new_turn: new G.MsgNewTurn({ player: m.player }),
}));
register(wire.YGOProMsgNewPhase, (m) => ({
  new_phase: new G.MsgNewPhase({
    phase_type:
      m.phase && m.phase <= 0x200 && (m.phase & (m.phase - 1)) === 0
        ? Math.log2(m.phase) + 1
        : G.MsgNewPhase.PhaseType.UNKNOWN,
  }),
}));
register(wire.YGOProMsgHint, (m) => ({
  hint: new G.MsgHint({
    player: m.player,
    hint_type: m.type <= 11 ? m.type : G.MsgHint.HintType.UNKNOWN,
    hint_data: m.desc,
  }),
}));
register(wire.YGOProMsgCardHint, (m) => ({
  duelEvent: {
    kind: "card-hint",
    location: cardLocation(m),
    type: m.type,
    value: m.value,
  },
}));
register(wire.YGOProMsgPlayerHint, (m) => ({
  duelEvent: {
    kind: "player-hint",
    player: m.player,
    type: m.type,
    value: m.value,
  },
}));
register(wire.YGOProMsgChainNegated, (m) => ({
  duelEvent: {
    kind: "chain-result",
    index: m.chainCount,
    result: "activation",
  },
}));
register(wire.YGOProMsgChainDisabled, (m) => ({
  duelEvent: { kind: "chain-result", index: m.chainCount, result: "effect" },
}));
register(wire.YGOProMsgSelectYesNo, (m) => ({
  select_yes_no: new G.MsgSelectYesNo({
    player: m.player,
    effect_description: m.desc,
  }),
}));
register(wire.YGOProMsgSelectEffectYn, (m) => ({
  select_effect_yn: new G.MsgSelectEffectYn({
    player: m.player,
    code: m.code,
    location: cardLocation(m),
    effect_description: m.desc,
  }),
}));
register(wire.YGOProMsgSelectOption, (m) => ({
  select_option: new G.MsgSelectOption({
    player: m.player,
    options: m.options.map(
      (code, response) => new G.MsgSelectOption.Option({ code, response }),
    ),
  }),
}));
register(wire.YGOProMsgSelectCard, (m) => ({
  select_card: new G.MsgSelectCard({
    player: m.player,
    cancelable: !!m.cancelable,
    min: m.min,
    max: m.max,
    cards: m.cards.map(
      (card, response) =>
        new G.MsgSelectCard.SelectAbleCard({
          code: card.code,
          location: cardLocation(card),
          response,
        }),
    ),
  }),
}));
register(wire.YGOProMsgSelectUnselectCard, (m) => ({
  select_unselect_card: new G.MsgSelectUnselectCard({
    player: m.player,
    cancelable: !!m.cancelable,
    finishable: !!m.finishable,
    min: m.min,
    max: m.max,
    selectable_cards: m.selectableCards.map(
      (card, response) =>
        new G.MsgSelectUnselectCard.Info({
          code: card.code,
          location: cardLocation(card),
          response,
        }),
    ),
    selected_cards: m.unselectableCards.map(
      (card, index) =>
        new G.MsgSelectUnselectCard.Info({
          code: card.code,
          location: cardLocation(card),
          response: m.selectableCards.length + index,
        }),
    ),
  }),
}));
register(wire.YGOProMsgSelectTribute, (m) => ({
  select_tribute: new G.MsgSelectTribute({
    player: m.player,
    cancelable: !!m.cancelable,
    min: m.min,
    max: m.max,
    selectable_cards: m.cards.map(
      (card, response) =>
        new G.MsgSelectTribute.Info({
          code: card.code,
          location: cardLocation(card),
          level: card.releaseParam,
          response,
        }),
    ),
  }),
}));
register(wire.YGOProMsgSelectChain, (m) => ({
  select_chain: new G.MsgSelectChain({
    player: m.player,
    special_count: m.specialCount,
    forced: m.chains.some((chain) => chain.forced > 0),
    hint0: m.hint0,
    hint1: m.hint1,
    chains: m.chains.map((chain, response) =>
      Object.assign(
        new G.MsgSelectChain.Chain({
          flag: numberToChainFlag(chain.edesc),
          code: chain.code % 1000000000,
          location: cardLocation(chain),
          effect_description: chain.desc,
          response,
        }),
        { forced: chain.forced > 0 },
      ),
    ),
  }),
}));
register(wire.YGOProMsgSelectPosition, (m) => ({
  select_position: new G.MsgSelectPosition({
    player: m.player,
    code: m.code,
    positions: [1, 2, 4, 8]
      .filter((position) => m.positions & position)
      .map(
        (position) =>
          new G.MsgSelectPosition.SelectAblePosition({
            position: numberToCardPosition(position),
          }),
      ),
  }),
}));
for (const Type of [wire.YGOProMsgSelectPlace, wire.YGOProMsgSelectDisField])
  register(Type, (m) => ({
    select_place: new G.MsgSelectPlace({
      player: m.player,
      count: m.count || 1,
      places: m.getSelectablePlaces().map(
        (place) =>
          new G.MsgSelectPlace.SelectAblePlace({
            controller: place.player,
            zone: numberToCardZone(place.location),
            sequence: place.sequence,
          }),
      ),
    }),
  }));
register(wire.YGOProMsgSelectIdleCmd, (m) => {
  const groups = [
    m.summonableCards,
    m.spSummonableCards,
    m.reposableCards,
    m.msetableCards,
    m.ssetableCards,
    m.activatableCards,
  ];
  const types = [
    G.MsgSelectIdleCmd.IdleCmd.IdleType.SUMMON,
    G.MsgSelectIdleCmd.IdleCmd.IdleType.SPSUMMON,
    G.MsgSelectIdleCmd.IdleCmd.IdleType.POS_CHANGE,
    G.MsgSelectIdleCmd.IdleCmd.IdleType.MSET,
    G.MsgSelectIdleCmd.IdleCmd.IdleType.SSET,
    G.MsgSelectIdleCmd.IdleCmd.IdleType.ACTIVATE,
  ];
  return {
    select_idle_cmd: new G.MsgSelectIdleCmd({
      player: m.player,
      enable_bp: m.canBp === 1,
      enable_ep: m.canEp === 1,
      enable_shuffle: m.canShuffle === 1,
      idle_cmds: groups.map(
        (cards, type) =>
          new G.MsgSelectIdleCmd.IdleCmd({
            idle_type: types[type],
            idle_datas: cards.map(
              (card, index) =>
                new G.MsgSelectIdleCmd.IdleCmd.IdleData({
                  card_info: cardInfo(card),
                  effect_description:
                    "desc" in card && typeof card.desc === "number"
                      ? card.desc
                      : undefined,
                  response: (index << 16) + type,
                }),
            ),
          }),
      ),
    }),
  };
});
register(wire.YGOProMsgSelectBattleCmd, (m) => ({
  select_battle_cmd: new G.MsgSelectBattleCmd({
    player: m.player,
    enable_m2: m.canM2 === 1,
    enable_ep: m.canEp === 1,
    battle_cmds: [
      new G.MsgSelectBattleCmd.BattleCmd({
        battle_type: G.MsgSelectBattleCmd.BattleCmd.BattleType.ACTIVATE,
        battle_datas: m.activatableCards.map(
          (card, index) =>
            new G.MsgSelectBattleCmd.BattleCmd.BattleData({
              card_info: cardInfo(card),
              effect_description: card.desc,
              response: index << 16,
            }),
        ),
      }),
      new G.MsgSelectBattleCmd.BattleCmd({
        battle_type: G.MsgSelectBattleCmd.BattleCmd.BattleType.ATTACK,
        battle_datas: m.attackableCards.map(
          (card, index) =>
            new G.MsgSelectBattleCmd.BattleCmd.BattleData({
              card_info: cardInfo(card),
              direct_attackable: card.directAttack === 1,
              response: (index << 16) + 1,
            }),
        ),
      }),
    ],
  }),
}));
register(wire.YGOProMsgSelectSum, (m) => {
  const convert = (
    card: wire.YGOProMsgSelectSum_CardInfo,
    response: number,
  ) => {
    const param = card.opParam;
    const level1 = param & 0x80000000 ? param & 0x7fffffff : param & 0xffff;
    const level2 = param & 0x80000000 ? level1 : param >> 16 || level1;
    return new G.MsgSelectSum.Info({
      code: card.code,
      location: cardLocation(card),
      level1,
      level2,
      response,
    });
  };
  return {
    select_sum: new G.MsgSelectSum({
      overflow: m.mode,
      player: m.player,
      level_sum: m.sumVal,
      min: m.min,
      max: m.max,
      must_select_cards: m.mustSelectCards.map(convert),
      selectable_cards: m.cards.map(convert),
    }),
  };
});
register(wire.YGOProMsgSelectCounter, (m) => ({
  select_counter: new G.MsgSelectCounter({
    player: m.player,
    counter_type: m.counterType,
    min: m.counterCount,
    options: m.cards.map(
      (card) =>
        new G.MsgSelectCounter.Info({
          code: card.code,
          location: cardLocation(card),
          counter_count: card.counterCount,
        }),
    ),
  }),
}));
register(wire.YGOProMsgSortCard, (m) => ({
  sort_card: new G.MsgSortCard({
    player: m.player,
    options: m.cards.map(
      (card, response) =>
        new G.MsgSortCard.Info({
          code: card.code,
          location: cardLocation(card),
          response,
        }),
    ),
  }),
}));
register(wire.YGOProMsgDamage, (m) => ({
  update_hp: new G.MsgUpdateHp({
    player: m.player,
    value: m.value,
    type_: G.MsgUpdateHp.ActionType.DAMAGE,
  }),
}));
register(wire.YGOProMsgPayLpCost, (m) => ({
  update_hp: new G.MsgUpdateHp({
    player: m.player,
    value: m.cost,
    type_: G.MsgUpdateHp.ActionType.DAMAGE,
  }),
}));
register(wire.YGOProMsgRecover, (m) => ({
  update_hp: new G.MsgUpdateHp({
    player: m.player,
    value: m.value,
    type_: G.MsgUpdateHp.ActionType.RECOVER,
  }),
}));
register(wire.YGOProMsgWin, (m) => ({
  win: new G.MsgWin({ win_player: m.player, reason: m.type }),
}));
register(wire.YGOProMsgWaiting, () => ({ wait: new G.MsgWait({}) }));
register(wire.YGOProMsgAttack, (m) => ({
  attack: new G.MsgAttack({
    attacker_location: cardLocation(m.attacker),
    target_location: m.defender.location ? cardLocation(m.defender) : undefined,
    direct_attack: !m.defender.location,
  }),
}));
for (const Type of [wire.YGOProMsgAddCounter, wire.YGOProMsgRemoveCounter])
  register(Type, (m) => ({
    update_counter: new G.MsgUpdateCounter({
      counter_type: m.counterType,
      location: cardLocation(m),
      count: m.count,
      action_type:
        m.identifier === 101
          ? G.MsgUpdateCounter.ActionType.ADD
          : G.MsgUpdateCounter.ActionType.REMOVE,
    }),
  }));
for (const Type of [wire.YGOProMsgShuffleHand, wire.YGOProMsgShuffleExtra])
  register(Type, (m) => ({
    shuffle_hand_extra: new G.MsgShuffleHandExtra({
      player: m.player,
      zone: m.identifier === 33 ? ygopro.CardZone.HAND : ygopro.CardZone.EXTRA,
      cards: m.cards,
    }),
  }));
for (const Type of [wire.YGOProMsgTossCoin, wire.YGOProMsgTossDice])
  register(Type, (m) => ({
    toss: new G.MsgToss({
      player: m.player,
      toss_type:
        m.identifier === 130
          ? G.MsgToss.TossType.COIN
          : G.MsgToss.TossType.DICE,
      res: m.results,
    }),
  }));
register(wire.YGOProMsgHandRes, (m) => ({
  hand_res: new G.MsgHandResult({
    result1: decodeHand(m.result & 3),
    result2: decodeHand((m.result >> 2) & 3),
  }),
}));
register(wire.YGOProMsgReverseDeck, () => ({
  shuffle_deck: Object.assign(new G.MsgShuffleDeck({ player: 0 }), {
    deckOperation: { kind: "reverse" },
  }),
}));
register(wire.YGOProMsgDeckTop, (m) => ({
  shuffle_deck: Object.assign(new G.MsgShuffleDeck({ player: m.player }), {
    deckOperation: {
      kind: "top",
      offset: m.sequence,
      code: m.code & 0x7fffffff,
      faceup: (m.code & 0x80000000) !== 0,
    },
  }),
}));
register(wire.YGOProMsgShuffleSetCard, (m) => ({
  shuffle_set_card: new G.MsgShuffleSetCard({
    zone: numberToCardZone(m.location),
    from_locations: m.cards.map((card) => cardLocation(card.oldLocation)),
    overlay_locations: m.cards.map((card) => cardLocation(card.newLocation)),
  }),
}));
for (const Type of [wire.YGOProMsgConfirmCards, wire.YGOProMsgConfirmDeckTop])
  register(Type, (m) => ({
    confirm_cards: Object.assign(
      new G.MsgConfirmCards({ player: m.player, cards: m.cards.map(cardInfo) }),
      m.identifier === 30 ? { is_decktop: true } : {},
    ),
  }));
register(wire.YGOProMsgFieldDisabled, (m) => ({
  field_disabled: new G.MsgFieldDisabled({
    actions: [0, 1].flatMap((controller) => [
      ...Array.from(
        { length: 5 },
        (_, sequence) =>
          new G.MsgFieldDisabled.Action({
            controller,
            zone: ygopro.CardZone.MZONE,
            sequence,
            disabled: !!(m.disabledField & (1 << (controller * 16 + sequence))),
          }),
      ),
      ...Array.from(
        { length: 8 },
        (_, sequence) =>
          new G.MsgFieldDisabled.Action({
            controller,
            zone: ygopro.CardZone.SZONE,
            sequence,
            disabled: !!(
              m.disabledField &
              (1 << (controller * 16 + 8 + sequence))
            ),
          }),
      ),
    ]),
  }),
}));
for (const Type of [wire.YGOProMsgAnnounceRace, wire.YGOProMsgAnnounceAttrib])
  register(Type, (m) => {
    const race = m instanceof wire.YGOProMsgAnnounceRace;
    const available = race ? m.availableRaces : m.availableAttributes;
    return {
      announce: new G.MsgAnnounce({
        player: m.player,
        min: m.count,
        announce_type: race
          ? G.MsgAnnounce.AnnounceType.RACE
          : G.MsgAnnounce.AnnounceType.Attribute,
        options: Array.from({ length: race ? 26 : 7 }, (_, code) => code)
          .filter((code) => available & (1 << code))
          .map(
            (code) => new G.MsgAnnounce.Option({ code, response: 1 << code }),
          ),
      }),
    };
  });
register(wire.YGOProMsgAnnounceCard, (m) => ({
  announce: new G.MsgAnnounce({
    player: m.player,
    announce_type: G.MsgAnnounce.AnnounceType.Card,
    options: m.opcodes.map(
      (code) => new G.MsgAnnounce.Option({ code, response: code }),
    ),
  }),
}));
register(wire.YGOProMsgAnnounceNumber, (m) => ({
  announce: new G.MsgAnnounce({
    player: m.player,
    announce_type: G.MsgAnnounce.AnnounceType.Number,
    options: m.numbers.map(
      (code, response) => new G.MsgAnnounce.Option({ code, response }),
    ),
  }),
}));
function relation(
  kind: "equip" | "unequip" | "target" | "cancel-target",
  card: WireLocation,
  target?: WireLocation,
) {
  const location = cardLocation(card);
  const action = Object.assign(new G.MsgUpdateData.Action({ location }), {
    relationUpdate: { kind, target: target && cardLocation(target) },
  });
  return {
    update_data: new G.MsgUpdateData({
      player: location.controller,
      zone: location.zone,
      actions: [action],
    }),
  };
}
register(wire.YGOProMsgEquip, (m) => relation("equip", m.equip, m.target));
register(wire.YGOProMsgUnequip, (m) => relation("unequip", m.card));
register(wire.YGOProMsgCardTarget, (m) => relation("target", m.card1, m.card2));
register(wire.YGOProMsgCancelTarget, (m) =>
  relation("cancel-target", m.card1, m.card2),
);
register(wire.YGOProMsgReloadField, (m) => ({
  reload_field: new G.MsgReloadField({
    duel_rule: m.duelRule,
    actions: m.players.map((player, index) => {
      const zones: G.MsgReloadField.ZoneAction[] = [];
      for (const [cards, zone] of [
        [player.mzone, ygopro.CardZone.MZONE],
        [player.szone, ygopro.CardZone.SZONE],
      ] as const)
        cards.forEach((card, sequence) => {
          if (card.occupied)
            zones.push(
              new G.MsgReloadField.ZoneAction({
                zone,
                sequence,
                position: numberToCardPosition(card.position ?? 0),
                overlay_count: card.xyzCount,
              }),
            );
        });
      for (const [count, zone] of [
        [player.deckCount, ygopro.CardZone.DECK],
        [player.handCount, ygopro.CardZone.HAND],
        [player.graveCount, ygopro.CardZone.GRAVE],
        [player.removedCount, ygopro.CardZone.REMOVED],
        [player.extraCount, ygopro.CardZone.EXTRA],
      ] as const)
        for (let sequence = 0; sequence < count; sequence++)
          zones.push(
            new G.MsgReloadField.ZoneAction({
              zone,
              sequence,
              position:
                zone === ygopro.CardZone.DECK ||
                (zone === ygopro.CardZone.EXTRA &&
                  sequence < count - player.extraPCount)
                  ? ygopro.CardPosition.FACEDOWN_ATTACK
                  : ygopro.CardPosition.FACEUP_ATTACK,
            }),
          );
      return new G.MsgReloadField.Action({
        player: index,
        lp: player.lp,
        zone_actions: zones,
      });
    }),
  }),
}));

/** 单条解码，未知消息不会中断同一网络帧的后续包。 */
export function decodeGame(data: Uint8Array): DuelGameMessage {
  if (!data.length) throw new Error("对局消息为空");
  const id = data[0];
  let fields: GameFields;
  if (id === 235) fields = { sibyl_name: legacyNames(data.slice(1)) };
  else if (id === 34)
    fields = { shuffle_deck: legacyDeck(data.slice(1), "refresh") };
  else {
    // 历史 MSG_START 没有 duelRule；补齐后仍由库解码。
    if (id === 4 && data.length === 18) {
      const normalized = new Uint8Array(19);
      normalized.set(data.subarray(0, 2));
      normalized.set(data.subarray(2), 3);
      data = normalized;
    }
    // 当前库按交错排列读取盖卡洗混，服务器先写完原位置，再写全部目标位置。
    if (id === 36) {
      const count = data[2];
      if (data.length !== 3 + count * 8)
        throw new Error("盖卡洗混消息长度无效");
      const normalized = data.slice();
      for (let index = 0; index < count; index++) {
        normalized.set(
          data.subarray(3 + index * 4, 7 + index * 4),
          3 + index * 8,
        );
        normalized.set(
          data.subarray(3 + (count + index) * 4, 7 + (count + index) * 4),
          7 + index * 8,
        );
      }
      data = normalized;
    }
    fields = decoders.get(id)?.(data) ?? {
      unimplemented: new G.MsgUnimplemented({ command: id }),
    };
  }
  const message: DuelGameMessage = new G(fields);
  if (fields.duelEvent) message.duelEvent = fields.duelEvent;
  return message;
}
