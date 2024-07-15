// Data schema for YgoAgent Service

/**
 * none for N/A or unknown or token.
 */
export enum Attribute {
  None = "none",
  Earth = "earth",
  Water = "water",
  Fire = "fire",
  Wind = "wind",
  Light = "light",
  Dark = "dark",
  Divine = "divine",
}

export enum Controller {
  Me = "me",
  Opponent = "opponent",
}

//
export enum Location {
  Deck = "deck",
  Extra = "extra",
  Grave = "grave",
  Hand = "hand",
  MZone = "mzone",
  Removed = "removed",
  SZone = "szone",
}

interface Place {
  controller: Controller;
  location: Location;
  /**
   * Start from 0
   */
  sequence: number;
}

interface Option {
  code: number;
}

export interface CardLocation {
  controller: Controller;
  location: Location;
  /**
   * if is overlay, this is the overlay index, starting from 0, else -1.
   */
  overlay_sequence: number;
  /**
   * Start from 0
   */
  sequence: number;
}

/**
 * If the monster is xyz material (overlay_sequence != -1), the position is faceup.
 */
export enum Position {
  None = "none",
  FaceupAttack = "faceup_attack",
  FacedownAttack = "facedown_attack",
  Attack = "attack",
  FaceupDefense = "faceup_defense",
  Faceup = "faceup",
  FacedownDefense = "facedown_defense",
  Facedown = "facedown",
  Defense = "defense",
}

/**
 * none for N/A or unknown or token.
 */
export enum Race {
  Aqua = "aqua",
  Beast = "beast",
  BeastWarrior = "beast_warrior",
  CreatorGod = "creator_god",
  Cyberse = "cyberse",
  Devine = "devine",
  Dinosaur = "dinosaur",
  Dragon = "dragon",
  Fairy = "fairy",
  Fiend = "fiend",
  Fish = "fish",
  Illusion = "illusion",
  Insect = "insect",
  Machine = "machine",
  None = "none",
  Plant = "plant",
  Psycho = "psycho",
  Pyro = "pyro",
  Reptile = "reptile",
  Rock = "rock",
  SeaSerpent = "sea_serpent",
  Spellcaster = "spellcaster",
  Thunder = "thunder",
  Warrior = "warrior",
  Windbeast = "windbeast",
  Wyrm = "wyrm",
  Zombie = "zombie",
}

export enum Type {
  Continuous = "continuous",
  Counter = "counter",
  Dual = "dual",
  Effect = "effect",
  Equip = "equip",
  Field = "field",
  Flip = "flip",
  Fusion = "fusion",
  Link = "link",
  Monster = "monster",
  Normal = "normal",
  Pendulum = "pendulum",
  QuickPlay = "quick_play",
  Ritual = "ritual",
  Special = "special",
  Spell = "spell",
  Spirit = "spirit",
  Synchro = "synchro",
  Token = "token",
  Toon = "toon",
  Trap = "trap",
  TrapMonster = "trap_monster",
  Tuner = "tuner",
  Union = "union",
  Xyz = "xyz",
}

export interface Card {
  /**
   * Card code from cards.cdb
   */
  code: number;
  location: Location;
  /**
   * Sequence in ocgcore, 0 is N/A or unknown, if not, shoud start from 1. Only non-zero for
   * cards in mzone, szone and grave.
   */
  sequence: number;
  controller: Controller;
  /**
   * If the monster is xyz material (overlay_sequence != -1), the position is faceup.
   */
  position: Position;
  /**
   * if is overlay, this is the overlay index, starting from 0, else -1.
   */
  overlay_sequence: number;

  /**
   * none for N/A or unknown or token.
   */
  attribute: Attribute;
  /**
   * none for N/A or unknown or token.
   */
  race: Race;
  /**
   * Rank and link are also considered as level. 0 is N/A or unknown.
   */
  level: number;
  /**
   * Number of counters. If there are 2 types of counters or more, we consider only the first
   * type of counter.
   */
  counter: number;
  /**
   * Whether the card effect is disabled or forbidden
   */
  negated: boolean;
  attack: number;
  defense: number;
  types: Type[];
}

export enum Phase {
  Battle = "battle",
  BattleStart = "battle_start",
  BattleStep = "battle_step",
  Damage = "damage",
  DamageCalculation = "damage_calculation",
  Draw = "draw",
  End = "end",
  Main1 = "main1",
  Main2 = "main2",
  Standby = "standby",
}

export interface Global {
  /**
   * Whether me is the first player
   */
  is_first: boolean;
  is_my_turn: boolean;
  my_lp: number;
  op_lp: number;
  phase: Phase;
  turn: number;
}

interface SelectAbleCard {
  location: CardLocation;
  response: number;
}

export interface MsgSelectCard {
  msg_type: "select_card";
  cancelable: boolean;
  min: number;
  max: number;
  cards: SelectAbleCard[];
  selected: number[];
}

export type MultiSelectMsg = MsgSelectCard | MsgSelectSum | MsgSelectTribute;

interface SelectTributeCard {
  location: CardLocation;
  level: number;
  response: number;
}

export interface MsgSelectTribute {
  msg_type: "select_tribute";
  cancelable: boolean;
  min: number;
  max: number;
  cards: SelectTributeCard[];
  selected: number[];
}

interface SelectSumCard {
  location: CardLocation;
  level1: number;
  level2: number;
  response: number;
}

export interface MsgSelectSum {
  msg_type: "select_sum";
  overflow: boolean;
  level_sum: number;
  min: number;
  max: number;
  cards: SelectSumCard[];
  must_cards: SelectSumCard[];
  selected: number[];
}

export interface CardInfo {
  code: number;
  controller: Controller;
  location: Location;
  sequence: number;
}

export enum IdleCmdType {
  Summon = "summon",
  SpSummon = "sp_summon",
  Reposition = "reposition",
  Mset = "mset",
  Set = "set",
  Activate = "activate",
  ToBp = "to_bp",
  ToEp = "to_ep",
}

interface IdleCmdData {
  card_info: CardInfo;
  effect_description: number;
  response: number;
}

export interface IdleCmd {
  cmd_type: IdleCmdType;
  data?: IdleCmdData;
}

export interface MsgSelectIdleCmd {
  msg_type: "select_idlecmd";
  idle_cmds: IdleCmd[];
}

export interface Chain {
  code: number;
  location: CardLocation;
  effect_description: number;
  response: number;
}

export interface MsgSelectChain {
  msg_type: "select_chain";
  forced: boolean;
  chains: Chain[];
}

export interface MsgSelectPosition {
  msg_type: "select_position";
  code: number;
  positions: Position[];
}

export interface MsgSelectYesNo {
  msg_type: "select_yesno";
  effect_description: number;
}

export interface MsgSelectEffectYn {
  msg_type: "select_effectyn";
  code: number;
  location: CardLocation;
  effect_description: number;
}

export enum BattleCmdType {
  Attack = "attack",
  Activate = "activate",
  ToM2 = "to_m2",
  ToEp = "to_ep",
}

export interface BattleCmdData {
  card_info: CardInfo;
  effect_description: number;
  direct_attackable: boolean;
  response: number;
}

export interface BattleCmd {
  cmd_type: BattleCmdType;
  data?: BattleCmdData;
}

export interface MsgSelectBattleCmd {
  msg_type: "select_battlecmd";
  battle_cmds: BattleCmd[];
}

export interface SelectUnselectCard {
  location: CardLocation;
  response: number;
}

export interface MsgSelectUnselectCard {
  msg_type: "select_unselect_card";
  finishable: boolean;
  cancelable: boolean;
  min: number;
  max: number;
  selected_cards: SelectUnselectCard[];
  selectable_cards: SelectUnselectCard[];
}

interface Option {
  code: number;
  response: number;
}

export interface MsgSelectOption {
  msg_type: "select_option";
  options: Option[];
}

interface Place {
  controller: Controller;
  location: Location;
  sequence: number;
}

export interface MsgSelectPlace {
  msg_type: "select_place";
  count: number;
  places: Place[];
}

interface AnnounceAttrib {
  attribute: Attribute;
  response: number;
}

export interface MsgAnnounceAttrib {
  msg_type: "announce_attrib";
  count: number;
  attributes: AnnounceAttrib[];
}

interface AnnounceNumber {
  number: number;
  response: number;
}

export interface MsgAnnounceNumber {
  msg_type: "announce_number";
  count: number;
  numbers: AnnounceNumber[];
}

type ActionMsgData =
  | MsgSelectCard
  | MsgSelectTribute
  | MsgSelectSum
  | MsgSelectIdleCmd
  | MsgSelectChain
  | MsgSelectPosition
  | MsgSelectYesNo
  | MsgSelectEffectYn
  | MsgSelectBattleCmd
  | MsgSelectUnselectCard
  | MsgSelectOption
  | MsgSelectPlace
  | MsgAnnounceAttrib
  | MsgAnnounceNumber;

export interface ActionMsg {
  data: ActionMsgData;
}

export interface Input {
  action_msg: ActionMsg;
  cards: Card[];
  global: Global;
}

interface ActionPredict {
  prob: number;
  response: number;
  can_finish: boolean;
}

export interface MsgResponse {
  action_preds: ActionPredict[];
  win_rate: number;
}
