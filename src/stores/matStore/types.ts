import type { ygopro } from "@/api";

// >>> play mat state >>>

export interface BothSide<T> {
  me: T;
  op: T;
  /** 根据controller返回对应的数组，op或者me */
  of: (controller: number) => T;
}

export interface MatState {
  selfType: number;

  initInfo: BothSide<InitInfo> & {
    set: (controller: number, obj: Partial<InitInfo>) => void;
  }; // 双方的初始化信息

  chains: ygopro.CardLocation[]; // 连锁的卡片位置

  timeLimits: BothSide<number> & {
    set: (controller: number, time: number) => void;
  }; // 双方的时间限制

  hint: HintState;

  currentPlayer: number; // 当前的操作方

  phase: PhaseState;

  result?: {
    isWin: boolean;
    reason: string;
  };

  unimplemented: number; // 未处理的`Message`

  tossResult?: string; // 骰子/硬币结果

  handResults: BothSide<HandResult> & {
    set: (controller: number, result: HandResult) => void;
  }; // 猜拳结果

  /**  根据自己的先后手判断是否是自己 */
  isMe: (player: number) => boolean;
}

export interface InitInfo {
  masterRule?: string;
  life: number;
  deckSize: number;
  extraSize: number;
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
  currentPhase: ygopro.StocGameMessage.MsgNewPhase.PhaseType;
  enableBp: boolean; // 允许进入战斗阶段
  enableM2: boolean; // 允许进入M2阶段
  enableEp: boolean; // 允许回合结束
}

export enum HandResult {
  UNKNOWN = 0,
  SCISSOR = 1,
  ROCK = 2,
  PAPER = 3,
}
// <<< play mat state <<<
