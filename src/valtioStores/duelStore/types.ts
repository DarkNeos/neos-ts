import type { CardMeta } from "@/api/cards";
import type { ygopro } from "@/api/ocgcore/idl/ocgcore";

export interface DuelState {
  selfType?: number;
  meInitInfo?: InitInfo; // 自己的初始状态
  opInitInfo?: InitInfo; // 对手的初始状态

  meHands: HandState; // 自己的手牌
  opHands: HandState; // 对手的手牌

  meMonsters: MonsterState; // 自己的怪兽区状态
  opMonsters: MonsterState; // 对手的怪兽区状态

  meMagics: MagicState; // 自己的魔法陷阱区状态
  opMagics: MagicState; // 对手的魔法陷阱区状态

  meGraveyard: GraveyardState; // 自己的墓地状态
  opGraveyard: GraveyardState; // 对手的墓地状态

  meBanishedZone: BanishedZoneState; // 自己的除外区状态
  opBanishedZone: BanishedZoneState; // 对手的除外区状态

  meDeck: DeckState; // 自己的卡组状态
  opDeck: DeckState; // 对手的卡组状态

  meExtraDeck: ExtraDeckState; // 自己的额外卡组状态
  opExtraDeck: ExtraDeckState; // 对手的额外卡组状态

  meTimeLimit?: TimeLimit; // 自己的计时
  opTimeLimit?: TimeLimit; // 对手的计时

  hint?: HintState;

  currentPlayer?: number; // 当前的操作方

  phase?: PhaseState;

  result?: ygopro.StocGameMessage.MsgWin.ActionType;

  waiting?: boolean;

  unimplemented?: number; // 未处理的`Message`
}

export interface InitInfo {
  masterRule?: string;
  life: number;
  deckSize: number;
  extraSize: number;
}

export interface CardState {
  occupant?: CardMeta; // 占据此位置的卡牌元信息
  location: {
    controler?: number;
    location: ygopro.CardZone;
    position?: ygopro.CardPosition;
    overlay_sequence?: number;
  }; // 位置信息
  idleInteractivities: Interactivity<number>[]; // IDLE状态下的互动信息
  placeInteractivities?: Interactivity<{
    controler: number;
    zone: ygopro.CardZone;
    sequence: number;
  }>; // 选择位置状态下的互动信息
  overlay_materials?: CardMeta[]; // 超量素材
  counters: { [type: number]: number }; // 指示器
  reload?: boolean; // 这个字段会在收到MSG_RELOAD_FIELD的时候设置成true，在收到MSG_UPDATE_DATE的时候设置成false
}

export interface DuelFieldState {
  inner: CardState[];
}

export interface Interactivity<T> {
  interactType: InteractType;
  // 如果`interactType`是`ACTIVATE`，这个字段是对应的效果编号
  activateIndex?: number;
  // 如果`interactType`是`ATTACK`，这个字段表示是否可以直接攻击
  directAttackAble?: boolean;
  // 用户点击后，需要回传给服务端的`response`
  response: T;
}

export enum InteractType {
  // 可普通召唤
  SUMMON = 1,
  // 可特殊召唤
  SP_SUMMON = 2,
  // 可改变表示形式
  POS_CHANGE = 3,
  // 可前场放置
  MSET = 4,
  // 可后场放置
  SSET = 5,
  // 可发动效果
  ACTIVATE = 6,
  // 可作为位置选择
  PLACE_SELECTABLE = 7,
  // 可攻击
  ATTACK = 8,
}

export interface HandState extends DuelFieldState {}
export interface MonsterState extends DuelFieldState {}
export interface MagicState extends DuelFieldState {}
export interface GraveyardState extends DuelFieldState {}
export interface BanishedZoneState extends DuelFieldState {}
export interface DeckState extends DuelFieldState {}
export interface ExtraDeckState extends DuelFieldState {}
export interface TimeLimit {
  leftTime: number;
}
export interface HintState {
  code: number;
  msg?: string;
  esHint?: string;
  esSelectHint?: string;
}
export interface PhaseState {
  currentPhase: string; // TODO 当前的阶段 应该改成enum
  enableBp: boolean; // 允许进入战斗阶段
  enableM2: boolean; // 允许进入M2阶段
  enableEp: boolean; // 允许回合结束
}
