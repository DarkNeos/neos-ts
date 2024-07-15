import { CardMeta, ygopro } from "@/api";
import {
  ATTRIBUTE_DARK,
  ATTRIBUTE_DEVINE,
  ATTRIBUTE_EARTH,
  ATTRIBUTE_FIRE,
  ATTRIBUTE_LIGHT,
  ATTRIBUTE_WATER,
  ATTRIBUTE_WIND,
  FACEDOWN_ATTACK,
  FACEDOWN_DEFENSE,
  FACEUP_ATTACK,
  FACEUP_DEFENSE,
  RACE_AQUA,
  RACE_BEAST,
  RACE_BEASTWARRIOR,
  RACE_CREATORGOD,
  RACE_CYBERSE,
  RACE_DEVINE,
  RACE_DINOSAUR,
  RACE_DRAGON,
  RACE_FAIRY,
  RACE_FIEND,
  RACE_FISH,
  RACE_INSECT,
  RACE_MACHINE,
  RACE_PLANT,
  RACE_PSYCHO,
  RACE_PYRO,
  RACE_REPTILE,
  RACE_ROCK,
  RACE_SEASERPENT,
  RACE_SPELLCASTER,
  RACE_THUNDER,
  RACE_WARRIOR,
  RACE_WINDBEAST,
  RACE_WYRM,
  RACE_ZOMBIE,
  TYPE_CONTINUOUS,
  TYPE_COUNTER,
  TYPE_DUAL,
  TYPE_EFFECT,
  TYPE_EQUIP,
  TYPE_FIELD,
  TYPE_FLIP,
  TYPE_FUSION,
  TYPE_LINK,
  TYPE_MONSTER,
  TYPE_NORMAL,
  TYPE_PENDULUM,
  TYPE_QUICKPLAY,
  TYPE_RITUAL,
  TYPE_SPELL,
  TYPE_SPIRIT,
  TYPE_SPSUMMON,
  TYPE_SYNCHRO,
  TYPE_TOKEN,
  TYPE_TOON,
  TYPE_TRAP,
  TYPE_TRAPMONSTER,
  TYPE_TUNER,
  TYPE_UNION,
  TYPE_XYZ,
} from "@/common";
import { extraCardTypes } from "@/common";
import { CardType } from "@/stores/cardStore";

import {
  ActionMsg,
  Attribute,
  BattleCmd,
  BattleCmdData,
  BattleCmdType,
  Card,
  CardInfo,
  CardLocation,
  Chain,
  Controller,
  IdleCmd,
  IdleCmdType,
  Location,
  MsgAnnounceAttrib,
  MsgAnnounceNumber,
  MsgSelectBattleCmd,
  MsgSelectCard,
  MsgSelectChain,
  MsgSelectEffectYn,
  MsgSelectIdleCmd,
  MsgSelectOption,
  MsgSelectPlace,
  MsgSelectPosition,
  MsgSelectSum,
  MsgSelectTribute,
  MsgSelectUnselectCard,
  MsgSelectYesNo,
  Phase,
  Position,
  Race,
  Type,
} from "./schema";

import GM = ygopro.StocGameMessage;
import _Phase = GM.MsgNewPhase.PhaseType;
import _IdleType = GM.MsgSelectIdleCmd.IdleCmd.IdleType;
import _BattleCmdType = GM.MsgSelectBattleCmd.BattleCmd.BattleType;

// from common.ts ATTRIBUTE_*
function numberToAttribute(attributeNumber: number): Attribute {
  switch (attributeNumber) {
    case 0x00:
      return Attribute.None;
    case ATTRIBUTE_EARTH:
      return Attribute.Earth;
    case ATTRIBUTE_WATER:
      return Attribute.Water;
    case ATTRIBUTE_FIRE:
      return Attribute.Fire;
    case ATTRIBUTE_WIND:
      return Attribute.Wind;
    case ATTRIBUTE_LIGHT:
      return Attribute.Light;
    case ATTRIBUTE_DARK:
      return Attribute.Dark;
    case ATTRIBUTE_DEVINE:
      return Attribute.Divine;
    default:
      throw new Error(`Unknown attribute number: ${attributeNumber}`);
  }
}

function cardZoneToLocation(zone: ygopro.CardZone): Location {
  switch (zone) {
    case ygopro.CardZone.DECK:
      return Location.Deck;
    case ygopro.CardZone.HAND:
      return Location.Hand;
    case ygopro.CardZone.MZONE:
      return Location.MZone;
    case ygopro.CardZone.SZONE:
      return Location.SZone;
    case ygopro.CardZone.GRAVE:
      return Location.Grave;
    case ygopro.CardZone.REMOVED:
      return Location.Removed;
    case ygopro.CardZone.EXTRA:
      return Location.Extra;
    default:
      throw new Error(`Unknown card zone: ${zone}`);
  }
}

function convertController(controller: number, player: number): Controller {
  return controller === player ? Controller.Me : Controller.Opponent;
}

function convertOverlaySequence(cl: ygopro.CardLocation): number {
  return cl.is_overlay ? cl.overlay_sequence : -1;
}

function convertCardLocation(
  cl: ygopro.CardLocation,
  player: number,
): CardLocation {
  return {
    controller: convertController(cl.controller, player),
    location: cardZoneToLocation(cl.zone),
    overlay_sequence: convertOverlaySequence(cl),
    sequence: cl.sequence,
  };
}

function convertPosition(position: ygopro.CardPosition): Position {
  switch (position) {
    case ygopro.CardPosition.FACEUP_ATTACK:
      return Position.FaceupAttack;
    case ygopro.CardPosition.FACEDOWN_ATTACK:
      return Position.FacedownAttack;
    case ygopro.CardPosition.FACEUP_DEFENSE:
      return Position.FaceupDefense;
    case ygopro.CardPosition.FACEDOWN_DEFENSE:
      return Position.FacedownDefense;
    case ygopro.CardPosition.FACEUP:
      return Position.Faceup;
    case ygopro.CardPosition.FACEDOWN:
      return Position.Facedown;
    case ygopro.CardPosition.ATTACK:
      return Position.Attack;
    case ygopro.CardPosition.DEFENSE:
      return Position.Defense;
    default:
      throw new Error(`Unknown card position: ${position}`);
  }
}

function numberToRace(raceNumber: number): Race {
  switch (raceNumber) {
    case 0x0:
      return Race.None;
    case RACE_WARRIOR:
      return Race.Warrior;
    case RACE_SPELLCASTER:
      return Race.Spellcaster;
    case RACE_FAIRY:
      return Race.Fairy;
    case RACE_FIEND:
      return Race.Fiend;
    case RACE_ZOMBIE:
      return Race.Zombie;
    case RACE_MACHINE:
      return Race.Machine;
    case RACE_AQUA:
      return Race.Aqua;
    case RACE_PYRO:
      return Race.Pyro;
    case RACE_ROCK:
      return Race.Rock;
    case RACE_WINDBEAST:
      return Race.Windbeast;
    case RACE_PLANT:
      return Race.Plant;
    case RACE_INSECT:
      return Race.Insect;
    case RACE_THUNDER:
      return Race.Thunder;
    case RACE_DRAGON:
      return Race.Dragon;
    case RACE_BEAST:
      return Race.Beast;
    case RACE_BEASTWARRIOR:
      return Race.BeastWarrior;
    case RACE_DINOSAUR:
      return Race.Dinosaur;
    case RACE_FISH:
      return Race.Fish;
    case RACE_SEASERPENT:
      return Race.SeaSerpent;
    case RACE_REPTILE:
      return Race.Reptile;
    case RACE_PSYCHO:
      return Race.Psycho;
    case RACE_DEVINE:
      return Race.Devine;
    case RACE_CREATORGOD:
      return Race.CreatorGod;
    case RACE_WYRM:
      return Race.Wyrm;
    case RACE_CYBERSE:
      return Race.Cyberse;
    default:
      throw new Error(`Unknown race number: ${raceNumber}`);
  }
}

function numberToType(typeNumber: number): Type {
  switch (typeNumber) {
    case TYPE_MONSTER:
      return Type.Monster;
    case TYPE_SPELL:
      return Type.Spell;
    case TYPE_TRAP:
      return Type.Trap;
    case TYPE_NORMAL:
      return Type.Normal;
    case TYPE_EFFECT:
      return Type.Effect;
    case TYPE_FUSION:
      return Type.Fusion;
    case TYPE_RITUAL:
      return Type.Ritual;
    case TYPE_TRAPMONSTER:
      return Type.TrapMonster;
    case TYPE_SPIRIT:
      return Type.Spirit;
    case TYPE_UNION:
      return Type.Union;
    case TYPE_DUAL:
      return Type.Dual;
    case TYPE_TUNER:
      return Type.Tuner;
    case TYPE_SYNCHRO:
      return Type.Synchro;
    case TYPE_TOKEN:
      return Type.Token;
    case TYPE_QUICKPLAY:
      return Type.QuickPlay;
    case TYPE_CONTINUOUS:
      return Type.Continuous;
    case TYPE_EQUIP:
      return Type.Equip;
    case TYPE_FIELD:
      return Type.Field;
    case TYPE_COUNTER:
      return Type.Counter;
    case TYPE_FLIP:
      return Type.Flip;
    case TYPE_TOON:
      return Type.Toon;
    case TYPE_XYZ:
      return Type.Xyz;
    case TYPE_PENDULUM:
      return Type.Pendulum;
    case TYPE_SPSUMMON:
      return Type.Special;
    case TYPE_LINK:
      return Type.Link;
    default:
      throw new Error(`Unknown type number: ${typeNumber}`);
  }
}

function getCounter(counters: { [type: number]: number }) {
  if (counters) {
    for (const type in counters) {
      return counters[type];
    }
  }
  return 0;
}

export function convertDeckCard(meta: CardMeta): Card {
  return {
    code: meta.id,
    location: Location.Deck,
    sequence: 0,
    controller: Controller.Me,
    position: Position.Facedown,
    overlay_sequence: -1,
    attribute: numberToAttribute(meta.data.attribute ?? 0),
    race: numberToRace(meta.data.race ?? 0),
    level: meta.data.level ?? 0,
    counter: 0,
    negated: false,
    attack: meta.data.atk ?? 0,
    defense: meta.data.def ?? 0,
    types: extraCardTypes(meta.data.type ?? 0).map(numberToType),
  };
}

export function convertCard(card: CardType, player: number): Card {
  // TODO (ygo-agent): opponent's visible facedown cards (confirm_cards)

  const { code, location, meta, counters } = card;

  return {
    code,
    location: cardZoneToLocation(location.zone),
    sequence: location.sequence,
    controller: convertController(location.controller, player),
    position: convertPosition(location.position),
    overlay_sequence: convertOverlaySequence(location),
    attribute: numberToAttribute(meta.data.attribute ?? 0),
    race: numberToRace(meta.data.race ?? 0),
    level: meta.data.level ?? 0,
    counter: getCounter(counters),
    // TODO (ygo-agent): add negated
    negated: false,
    attack: meta.data.atk ?? 0,
    defense: meta.data.def ?? 0,
    types: extraCardTypes(meta.data.type ?? 0).map(numberToType),
  };
}

export function convertPhase(phase: _Phase): Phase {
  switch (phase) {
    case _Phase.DRAW:
      return Phase.Draw;
    case _Phase.STANDBY:
      return Phase.Standby;
    case _Phase.MAIN1:
      return Phase.Main1;
    case _Phase.BATTLE_START:
      return Phase.BattleStart;
    case _Phase.BATTLE_STEP:
      return Phase.BattleStep;
    case _Phase.DAMAGE_GAL:
      return Phase.DamageCalculation;
    case _Phase.DAMAGE:
      return Phase.Damage;
    case _Phase.BATTLE:
      return Phase.Battle;
    case _Phase.MAIN2:
      return Phase.Main2;
    case _Phase.END:
      return Phase.End;
    default:
      throw new Error(`Unknown phase: ${phase}`);
  }
}

export function parsePlayerFromMsg(msg: GM): number {
  switch (msg.gameMsg) {
    case "select_card":
      return msg.select_card.player;
    case "select_tribute":
      return msg.select_tribute.player;
    case "select_sum":
      return msg.select_sum.player;
    case "select_idle_cmd":
      return msg.select_idle_cmd.player;
    case "select_chain":
      return msg.select_chain.player;
    case "select_position":
      return msg.select_position.player;
    case "select_effect_yn":
      return msg.select_effect_yn.player;
    case "select_yes_no":
      return msg.select_yes_no.player;
    case "select_battle_cmd":
      return msg.select_battle_cmd.player;
    case "select_unselect_card":
      return msg.select_unselect_card.player;
    case "select_option":
      return msg.select_option.player;
    case "select_place":
      return msg.select_place.player;
    case "announce":
      return msg.announce.player;
    default:
      throw new Error(`Unsupported message type: ${msg}`);
  }
}

function convertMsgSelectCard(msg: GM.MsgSelectCard): MsgSelectCard {
  // response is -1 for finish
  return {
    msg_type: "select_card",
    cancelable: msg.cancelable,
    min: msg.min,
    max: msg.max,
    cards: msg.cards.map((c) => ({
      location: convertCardLocation(c.location, msg.player),
      response: c.response,
    })),
    selected: [],
  };
}

function convertMsgSelectTribute(msg: GM.MsgSelectTribute): MsgSelectTribute {
  return {
    msg_type: "select_tribute",
    cancelable: msg.cancelable,
    min: msg.min,
    max: msg.max,
    cards: msg.selectable_cards.map((c) => ({
      location: convertCardLocation(c.location, msg.player),
      level: c.level,
      response: c.response,
    })),
    selected: [],
  };
}

function convertMsgSelectSum(msg: GM.MsgSelectSum): MsgSelectSum {
  return {
    msg_type: "select_sum",
    overflow: msg.overflow !== 0,
    level_sum: msg.level_sum,
    min: msg.min,
    max: msg.max,
    cards: msg.selectable_cards.map((c) => ({
      location: convertCardLocation(c.location, msg.player),
      level1: c.level1,
      level2: c.level2,
      response: c.response,
    })),
    must_cards: msg.must_select_cards.map((c) => ({
      location: convertCardLocation(c.location, msg.player),
      level1: c.level1,
      level2: c.level2,
      response: c.response,
    })),
    selected: [],
  };
}

function convertCardInfo(cardInfo: ygopro.CardInfo, player: number): CardInfo {
  return {
    code: cardInfo.code,
    controller: convertController(cardInfo.controller, player),
    location: cardZoneToLocation(cardInfo.location),
    sequence: cardInfo.sequence,
  };
}

function convertIdleCmdType(cmdType: _IdleType): IdleCmdType {
  switch (cmdType) {
    case _IdleType.ACTIVATE:
      return IdleCmdType.Activate;
    case _IdleType.MSET:
      return IdleCmdType.Mset;
    case _IdleType.POS_CHANGE:
      return IdleCmdType.Reposition;
    case _IdleType.SSET:
      return IdleCmdType.Set;
    case _IdleType.SPSUMMON:
      return IdleCmdType.SpSummon;
    case _IdleType.SUMMON:
      return IdleCmdType.Summon;
    case _IdleType.TO_BP:
      return IdleCmdType.ToBp;
    case _IdleType.TO_EP:
      return IdleCmdType.ToEp;
    default:
      throw new Error(`Unknown idle command type: ${cmdType}`);
  }
}

function convertMsgSelectIdleCmd(msg: GM.MsgSelectIdleCmd): MsgSelectIdleCmd {
  const idle_cmds: IdleCmd[] = [];
  for (const cmd of msg.idle_cmds) {
    for (const data of cmd.idle_datas) {
      const cmd_type = convertIdleCmdType(cmd.idle_type);
      if (
        cmd_type === IdleCmdType.Summon ||
        cmd_type === IdleCmdType.SpSummon ||
        cmd_type === IdleCmdType.Reposition ||
        cmd_type === IdleCmdType.Mset ||
        cmd_type === IdleCmdType.Set ||
        cmd_type === IdleCmdType.Activate
      ) {
        idle_cmds.push({
          cmd_type,
          data: {
            card_info: convertCardInfo(data.card_info, msg.player),
            effect_description:
              cmd_type === IdleCmdType.Activate ? data.effect_description : 0,
            response: data.response,
          },
        });
      } else {
        throw new Error(`Unsupported idle command type: ${cmd_type}`);
      }
    }
  }
  if (msg.enable_bp) {
    // response will be 6
    idle_cmds.push({ cmd_type: IdleCmdType.ToBp });
  }
  // TODO (ygo-agent): new models will support it
  if (msg.enable_ep && !msg.enable_bp) {
    // response will be 7
    idle_cmds.push({ cmd_type: IdleCmdType.ToEp });
  }
  return {
    msg_type: "select_idlecmd",
    idle_cmds: idle_cmds,
  };
}

function convertChain(chain: GM.MsgSelectChain.Chain, player: number): Chain {
  return {
    code: chain.code,
    location: convertCardLocation(chain.location, player),
    effect_description: chain.effect_description,
    response: chain.response,
  };
}

function convertMsgSelectChain(msg: GM.MsgSelectChain): MsgSelectChain {
  // response is -1 for cancel
  return {
    msg_type: "select_chain",
    forced: msg.forced,
    chains: msg.chains.map((c) => convertChain(c, msg.player)),
  };
}

function convertMsgSelectPosition(
  msg: GM.MsgSelectPosition,
): MsgSelectPosition {
  return {
    msg_type: "select_position",
    code: msg.code,
    // response will be equal to POS_* from ocgcore
    // POS_FACEUP_ATTACK: 0x1, POS_FACEDOWN_ATTACK: 0x2,
    // POS_FACEUP_DEFENSE: 0x4, POS_FACEDOWN_DEFENSE: 0x8
    positions: msg.positions.map((p) => convertPosition(p.position)),
  };
}

function convertMsgSelectYesNo(msg: GM.MsgSelectYesNo): MsgSelectYesNo {
  // response is 1 for yes and 0 for no
  return {
    msg_type: "select_yesno",
    effect_description: msg.effect_description,
  };
}

function convertMsgSelectEffectYn(
  msg: GM.MsgSelectEffectYn,
): MsgSelectEffectYn {
  // response is 1 for yes and 0 for no
  return {
    msg_type: "select_effectyn",
    code: msg.code,
    location: convertCardLocation(msg.location, msg.player),
    effect_description: msg.effect_description,
  };
}

function convertBattleCmdType(cmdType: _BattleCmdType): BattleCmdType {
  switch (cmdType) {
    case _BattleCmdType.ATTACK:
      return BattleCmdType.Attack;
    case _BattleCmdType.ACTIVATE:
      return BattleCmdType.Activate;
    default:
      throw new Error(`Unknown battle command type: ${cmdType}`);
  }
}

function convertMsgSelectBattleCmd(
  msg: GM.MsgSelectBattleCmd,
): MsgSelectBattleCmd {
  const battle_cmds: BattleCmd[] = [];
  for (const cmd of msg.battle_cmds) {
    const cmd_type = convertBattleCmdType(cmd.battle_type);
    for (const data of cmd.battle_datas) {
      const battle_data: BattleCmdData = {
        card_info: convertCardInfo(data.card_info, msg.player),
        effect_description: data.effect_description,
        direct_attackable: data.direct_attackable,
        response: data.response,
      };
      battle_cmds.push({ cmd_type, data: battle_data });
    }
  }
  if (msg.enable_m2) {
    // response will be 2
    battle_cmds.push({ cmd_type: BattleCmdType.ToM2 });
  }
  // TODO (ygo-agent): new models will support it
  if (msg.enable_ep && !msg.enable_m2) {
    // response will be 3
    battle_cmds.push({ cmd_type: BattleCmdType.ToEp });
  }
  return {
    msg_type: "select_battlecmd",
    battle_cmds,
  };
}

function convertMsgSelectUnselectCard(
  msg: GM.MsgSelectUnselectCard,
): MsgSelectUnselectCard {
  return {
    msg_type: "select_unselect_card",
    // response is -1 for finish
    finishable: msg.finishable,
    cancelable: msg.cancelable,
    min: msg.min,
    max: msg.max,
    selected_cards: msg.selected_cards.map((c) => ({
      location: convertCardLocation(c.location, msg.player),
      response: c.response,
    })),
    selectable_cards: msg.selectable_cards.map((c) => ({
      location: convertCardLocation(c.location, msg.player),
      response: c.response,
    })),
  };
}

function convertMsgSelectOption(msg: GM.MsgSelectOption): MsgSelectOption {
  return {
    msg_type: "select_option",
    options: msg.options.map((o) => ({
      code: o.code,
      response: o.response,
    })),
  };
}

// TODO (ygo-agent): SelectDisfield is different from SelectPlace
function convertMsgSelectPlace(msg: GM.MsgSelectPlace): MsgSelectPlace {
  return {
    msg_type: "select_place",
    count: msg.count,
    places: msg.places.map((p) => ({
      // NOTICE: the response is the index of the place in the places array
      controller: convertController(p.controller, msg.player),
      location: cardZoneToLocation(p.zone),
      sequence: p.sequence,
    })),
  };
}

function convertMsgAnnounceAttrib(msg: GM.MsgAnnounce): MsgAnnounceAttrib {
  return {
    msg_type: "announce_attrib",
    count: msg.min,
    // from api/ocgcore/ocgAdapter/stoc/stocGameMsg/announceAttrib.ts
    attributes: msg.options.map((a) => ({
      attribute: numberToAttribute(1 << a.code),
      response: a.response,
    })),
  };
}

function convertMsgAnnounceNumber(msg: GM.MsgAnnounce): MsgAnnounceNumber {
  return {
    msg_type: "announce_number",
    count: msg.min,
    numbers: msg.options.map((o) => ({
      number: o.code,
      response: o.response,
    })),
  };
}

export function convertActionMsg(msg: ygopro.StocGameMessage): ActionMsg {
  switch (msg.gameMsg) {
    case "select_card":
      return {
        data: convertMsgSelectCard(msg.select_card),
      };
    case "select_tribute":
      return { data: convertMsgSelectTribute(msg.select_tribute) };
    case "select_sum":
      return { data: convertMsgSelectSum(msg.select_sum) };
    case "select_idle_cmd":
      return { data: convertMsgSelectIdleCmd(msg.select_idle_cmd) };
    case "select_chain":
      return { data: convertMsgSelectChain(msg.select_chain) };
    case "select_position":
      return { data: convertMsgSelectPosition(msg.select_position) };
    case "select_effect_yn":
      return { data: convertMsgSelectEffectYn(msg.select_effect_yn) };
    case "select_yes_no":
      return { data: convertMsgSelectYesNo(msg.select_yes_no) };
    case "select_battle_cmd":
      return { data: convertMsgSelectBattleCmd(msg.select_battle_cmd) };
    case "select_unselect_card":
      return { data: convertMsgSelectUnselectCard(msg.select_unselect_card) };
    case "select_option":
      return { data: convertMsgSelectOption(msg.select_option) };
    case "select_place":
      return { data: convertMsgSelectPlace(msg.select_place) };
    case "announce": {
      const announce = msg.announce;
      if (announce.announce_type === GM.MsgAnnounce.AnnounceType.Attribute) {
        return {
          data: convertMsgAnnounceAttrib(announce),
        };
      } else if (
        announce.announce_type === GM.MsgAnnounce.AnnounceType.Number
      ) {
        return {
          data: convertMsgAnnounceNumber(announce),
        };
      } else {
        throw new Error(`Unsupported announce type: ${announce.announce_type}`);
      }
    }
    default:
      throw new Error(`Unsupported message type: ${msg}`);
  }
}

export function convertPositionResponse(response: number): ygopro.CardPosition {
  switch (response) {
    case FACEUP_ATTACK:
      return ygopro.CardPosition.FACEUP_ATTACK;
    case FACEDOWN_ATTACK:
      return ygopro.CardPosition.FACEDOWN_ATTACK;
    case FACEUP_DEFENSE:
      return ygopro.CardPosition.FACEUP_DEFENSE;
    case FACEDOWN_DEFENSE:
      return ygopro.CardPosition.FACEDOWN_DEFENSE;
    default:
      throw new Error(`Invalid position response: ${response}`);
  }
}
