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

  attackDeclaration: {
    attackerUuid: string;
    targetUuid?: string;
    directAttack: boolean;
  } | null;

  // 保留发动时的公开卡号，不随移卡、洗牌或单段结算改变。
  chainCards: {
    code: number;
    controller: number;
    solved: boolean;
    building?: boolean;
    resolving?: boolean;
    cardUuid?: string;
    targets?: string[];
    negated?: "activation" | "effect";
  }[];

  playerHints: Record<number, Record<number, number>>;

  chainSetting: ChainSetting; // 连锁类型

  deckReserved: boolean; // 双方卡组是否反转

  timeLimits: BothSide<number> & {
    set: (controller: number, time: number) => void;
    activePlayer: number | null;
    receivedAt: number;
    limit: number;
  }; // 双方的时间限制

  stopClock: () => void;
  clearPhaseCommands: () => void;

  hint: HintState;

  currentPlayer: number; // 当前的操作方

  phase: PhaseState;

  unimplemented: number; // 未处理的`Message`

  tossResult?: string; // 骰子/硬币结果

  handResults: BothSide<HandResult> & {
    set: (controller: number, result: HandResult) => void;
  }; // 猜拳结果

  duelEnd: boolean; // 决斗是否结束，包括单局模式和匹配模式

  /**  根据自己的先后手判断是否是自己 */
  isMe: (player: number) => boolean;

  turnCount: number;
  error: string;
}

export interface InitInfo {
  masterRule?: string;
  life: number;
  deckSize: number;
  extraSize: number;
}

export interface Interactivity<T> {
  interactType: InteractType;
  responseSource?: "idle" | "battle";
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
  zones?: { controller: number; zone: ygopro.CardZone; sequence: number }[];
  zoneHintAt?: number;
}

export interface PhaseState {
  currentPhase: ygopro.StocGameMessage.MsgNewPhase.PhaseType;
  command: { id: number; type: "idle" | "battle"; player: number } | null;
  enableBp: boolean; // 允许进入战斗阶段
  enableM2: boolean; // 允许进入M2阶段
  enableEp: boolean; // 允许回合结束
}

export enum HandResult {
  UNKNOWN = 0,
  ROCK = 1,
  SCISSOR = 2,
  PAPER = 3,
}

export enum ChainSetting {
  CHAIN_ALL = 0, // 打开全部时点
  CHAIN_IGNORE = 1, // 关闭连锁时点
  CHAIN_SMART = 2, // 只打开关键时点
  CHAIN_AVAILABLE = 3, // 有合法可发动效果时询问，不受关键时点限制
}
// <<< play mat state <<<
