import type { CardMeta } from "@/api/cards";
import type { ygopro } from "@/api/ocgcore/idl/ocgcore";

// >>> play mat state >>>

export interface BothSide<T> {
  me: T;
  op: T;
}

export interface CardsBothSide<T extends DuelFieldState> extends BothSide<T> {
  /** 根据controller返回对应的数组 */
  at: (controller: number) => T;
  /** 移除特定位置的卡片 */
  remove: (player: number, sequence: number) => void;
  /** 在末尾添加卡片 */
  add: (controller: number, ids: number[]) => void;
  /** 在指定位置插入卡片 */
  insert: (controller: number, sequence: number, id: number) => void;
  /** 设置占据这个位置的卡片信息 */
  setOccupant: (
    controller: number,
    sequence: number,
    id: number,
    position?: ygopro.CardPosition
  ) => void;
  /** 移除卡片的卡片信息 */
  removeOccupant: (controller: number, sequence: number) => void;
  /** 添加 idle 的交互性 */
  addIdleInteractivity: (
    controller: number,
    sequence: number,
    interactivity: CardState["idleInteractivities"][number]
  ) => void;
  /** 移除 idle 的交互性 */
  clearIdleInteractivities: (controller: number, sequence: number) => void;
  /** 设置 place 的交互种类 */
  setPlaceInteractivityType: (
    controller: number,
    sequence: number,
    interactType: InteractType
  ) => void;
  /** 移除 place 的交互性 */
  clearPlaceInteractivity: (controller: number, sequence: number) => void;
}

export interface MatState {
  selfType: number;

  initInfo: BothSide<InitInfo> & {
    set: (controller: number, obj: Partial<InitInfo>) => void;
  }; // 双方的初始化信息

  hands: CardsBothSide<HandState>; // 双方的手牌

  monsters: CardsBothSide<MonsterState>; // 双方的怪兽区状态

  magics: CardsBothSide<MagicState>; // 双方的魔法区状态

  graveyards: CardsBothSide<GraveyardState>; // 双方的墓地状态

  banishedZones: CardsBothSide<BanishedZoneState>; // 双方的除外区状态

  decks: CardsBothSide<DeckState>; // 双方的卡组状态

  extraDecks: CardsBothSide<ExtraDeckState>; // 双方的额外卡组状态

  timeLimits: BothSide<number>; // 双方的时间限制

  hint: HintState & HintMethods;

  currentPlayer: number; // 当前的操作方

  phase: PhaseState;

  result: ygopro.StocGameMessage.MsgWin.ActionType;

  waiting: boolean;

  unimplemented: number; // 未处理的`Message`

  getZone: (zone: ygopro.CardZone) => CardsBothSide<DuelFieldState>; // 是否在某个区域
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

/**
 * CardState的顺序index，被称为sequence
 */
export type DuelFieldState = CardState[];

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
// 和hint相关的方法
export interface HintMethods {
  fetchCommonHintMeta: (hintData: number) => void;
  fetchSelectHintMeta: (args: {
    selectHintData: number;
    esHint?: string;
  }) => Promise<void>;
  fetchEsHintMeta: (args: {
    originMsg: string | number;
    location?: ygopro.CardLocation;
    cardID?: number;
  }) => Promise<void>;
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
