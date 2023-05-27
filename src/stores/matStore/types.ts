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

  blocks: BlockState[]; // 场上`Block`信息，比如怪兽区，墓地等

  chains: ygopro.CardLocation[]; // 连锁的卡片位置

  timeLimits: BothSide<number> & {
    set: (controller: number, time: number) => void;
  }; // 双方的时间限制

  hint: HintState;

  currentPlayer: number; // 当前的操作方

  phase: PhaseState;

  result: ygopro.StocGameMessage.MsgWin.ActionType;

  waiting: boolean;

  unimplemented: number; // 未处理的`Message`

  /**  根据自己的先后手判断是否是自己 */
  isMe: (player: number) => boolean;
}

export interface BlockState {
  // `Block`的位置
  location: {
    controller: number;
    zone: ygopro.CardZone;
    sequence: number;
  };
  // 位置选择信息，如果当前`Block`可以被选择作为
  // 怪兽召唤/发动魔陷的位置时，该字段会被设置
  selectInfo?: Interactivity<{
    controler: number;
    zone: ygopro.CardZone;
    sequence: number;
  }>;
}

export interface InitInfo {
  masterRule?: string;
  name: string;
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
  currentPhase: ygopro.StocGameMessage.MsgNewPhase.PhaseType; // TODO 当前的阶段 应该改成enum
  enableBp: boolean; // 允许进入战斗阶段
  enableM2: boolean; // 允许进入M2阶段
  enableEp: boolean; // 允许回合结束
}
// <<< play mat state <<<
