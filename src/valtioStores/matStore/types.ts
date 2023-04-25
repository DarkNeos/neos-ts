import type { ygopro } from "@/api";
import type { CardMeta } from "@/api/cards";

// >>> play mat state >>>

export interface BothSide<T> {
  me: T;
  op: T;
  /** 根据controller返回对应的数组，op或者me */
  of: (controller: number) => T;
}
/**
 * CardState的顺序index，被称为sequence
 */
export interface DuelFieldState extends Array<CardState> {
  /** 移除特定位置的卡片 */
  remove: (sequence: number) => void;
  /** 在末尾添加卡片 */
  insert: (sequence: number, id: number) => Promise<void>;
  /** 在指定位置插入卡片 */
  add: (ids: number[]) => Promise<void>;
  /** 设置占据这个位置的卡片信息 */
  setOccupant: (
    sequence: number,
    id: number,
    position?: ygopro.CardPosition
  ) => Promise<void>;
  /** 添加 idle 的交互性 */
  addIdleInteractivity: (
    sequence: number,
    interactivity: CardState["idleInteractivities"][number]
  ) => void;
  /** 移除 idle 的交互性 */
  clearIdleInteractivities: () => void;
  /** 设置 place 的交互种类 */
  setPlaceInteractivityType: (
    sequence: number,
    interactType: InteractType
  ) => void;
  /** 移除 place 的交互性 */
  clearPlaceInteractivity: () => void;

  // 让原型链不报错
  __proto__?: DuelFieldState;
}

type test = DuelFieldState extends (infer S)[] ? S : never;

export interface MatState {
  selfType: number;

  initInfo: BothSide<InitInfo> & {
    set: (controller: number, obj: Partial<InitInfo>) => void;
  }; // 双方的初始化信息

  hands: BothSide<HandState>; // 双方的手牌

  monsters: BothSide<MonsterState>; // 双方的怪兽区状态

  magics: BothSide<MagicState>; // 双方的魔法区状态

  graveyards: BothSide<GraveyardState>; // 双方的墓地状态

  banishedZones: BothSide<BanishedZoneState>; // 双方的除外区状态

  decks: BothSide<DeckState>; // 双方的卡组状态

  extraDecks: BothSide<ExtraDeckState>; // 双方的额外卡组状态

  timeLimits: BothSide<number> & {
    set: (controller: number, time: number) => void;
  }; // 双方的时间限制

  hint: HintState;

  currentPlayer: number; // 当前的操作方

  phase: PhaseState;

  result: ygopro.StocGameMessage.MsgWin.ActionType;

  waiting: boolean;

  unimplemented: number; // 未处理的`Message`

  // >>> methods >>>
  /** 根据zone获取hands/masters/magics... */
  in: (zone: ygopro.CardZone) => BothSide<DuelFieldState>;
  /**  根据自己的先后手判断是否是自己 */
  isMe: (player: number) => boolean;
}

export interface InitInfo {
  masterRule?: string;
  life: number;
  deckSize: number;
  extraSize: number;
}

/**
 * 场上某位置的状态，
 * 以后会更名为 BlockState
 */
export interface CardState {
  occupant?: CardMeta; // 占据此位置的卡牌元信息
  location: {
    controler?: number; // 控制这个位置的玩家，0或1
    location: ygopro.CardZone; // 怪兽区/魔法陷阱区/手牌/卡组/墓地/除外区
    position?: ygopro.CardPosition; // 卡片的姿势：攻击还是守备
  }; // 位置信息，叫location的原因是为了和ygo对齐
  idleInteractivities: Interactivity<number>[]; // IDLE状态下的互动信息
  placeInteractivity?: Interactivity<{
    controler: number;
    zone: ygopro.CardZone;
    sequence: number;
  }>; // 选择位置状态下的互动信息
  overlay_materials?: CardMeta[]; // 超量素材
  counters: { [type: number]: number }; // 指示器
  reload?: boolean; // 这个字段会在收到MSG_RELOAD_FIELD的时候设置成true，在收到MSG_UPDATE_DATE的时候设置成false
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

export type PhaseName =
  keyof typeof ygopro.StocGameMessage.MsgNewPhase.PhaseType;

export interface PhaseState {
  currentPhase: PhaseName; // TODO 当前的阶段 应该改成enum
  enableBp: boolean; // 允许进入战斗阶段
  enableM2: boolean; // 允许进入M2阶段
  enableEp: boolean; // 允许回合结束
}
// <<< play mat state <<<
