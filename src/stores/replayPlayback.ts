export const ReplayAdvanceFlag = {
  START: 1 << 0,
  DRAW: 1 << 1,
  NEW_TURN: 1 << 2,
  NEW_PHASE: 1 << 3,
  MOVE: 1 << 4,
  SET: 1 << 5,
  SWAP: 1 << 6,
  SUMMONING: 1 << 7,
  SUMMONED: 1 << 8,
  FLIP_SUMMONING: 1 << 9,
  FLIP_SUMMONED: 1 << 10,
  SP_SUMMONING: 1 << 11,
  SP_SUMMONED: 1 << 12,
  CHAINING: 1 << 13,
  CHAIN_SOLVED: 1 << 14,
  CHAIN_END: 1 << 15,
  ATTACK: 1 << 16,
  POS_CHANGE: 1 << 17,
  UPDATE_HP: 1 << 18,
  WIN: 1 << 19,
  BECOME_TARGET: 1 << 20,
  RELOAD_FIELD: 1 << 21,
  SHUFFLE_HAND_EXTRA: 1 << 22,
  SHUFFLE_SET_CARD: 1 << 23,
  FIELD_DISABLED: 1 << 24,
  CONFIRM_CARDS: 1 << 25,
  UPDATE_COUNTER: 1 << 26,
  UPDATE_DATA: 1 << 27,
  DECK: 1 << 28,
} as const;

// UPDATE_DATA 是常规资料同步，默认不单独停顿，避免把一次动作拆成多个步骤。
export const DEFAULT_REPLAY_ADVANCE_MASK =
  ReplayAdvanceFlag.START |
  ReplayAdvanceFlag.DRAW |
  ReplayAdvanceFlag.NEW_TURN |
  ReplayAdvanceFlag.NEW_PHASE |
  ReplayAdvanceFlag.MOVE |
  ReplayAdvanceFlag.SET |
  ReplayAdvanceFlag.SWAP |
  ReplayAdvanceFlag.SUMMONING |
  ReplayAdvanceFlag.SUMMONED |
  ReplayAdvanceFlag.FLIP_SUMMONING |
  ReplayAdvanceFlag.FLIP_SUMMONED |
  ReplayAdvanceFlag.SP_SUMMONING |
  ReplayAdvanceFlag.SP_SUMMONED |
  ReplayAdvanceFlag.CHAINING |
  ReplayAdvanceFlag.CHAIN_SOLVED |
  ReplayAdvanceFlag.CHAIN_END |
  ReplayAdvanceFlag.ATTACK |
  ReplayAdvanceFlag.POS_CHANGE |
  ReplayAdvanceFlag.UPDATE_HP |
  ReplayAdvanceFlag.WIN |
  ReplayAdvanceFlag.BECOME_TARGET |
  ReplayAdvanceFlag.RELOAD_FIELD |
  ReplayAdvanceFlag.SHUFFLE_HAND_EXTRA |
  ReplayAdvanceFlag.SHUFFLE_SET_CARD |
  ReplayAdvanceFlag.FIELD_DISABLED |
  ReplayAdvanceFlag.CONFIRM_CARDS |
  ReplayAdvanceFlag.UPDATE_COUNTER |
  ReplayAdvanceFlag.DECK;

const GAME_MSG_ADVANCE_FLAGS: Record<string, number> = {
  start: ReplayAdvanceFlag.START,
  draw: ReplayAdvanceFlag.DRAW,
  new_turn: ReplayAdvanceFlag.NEW_TURN,
  new_phase: ReplayAdvanceFlag.NEW_PHASE,
  move: ReplayAdvanceFlag.MOVE,
  set: ReplayAdvanceFlag.SET,
  swap: ReplayAdvanceFlag.SWAP,
  summoning: ReplayAdvanceFlag.SUMMONING,
  summoned: ReplayAdvanceFlag.SUMMONED,
  flip_summoning: ReplayAdvanceFlag.FLIP_SUMMONING,
  flip_summoned: ReplayAdvanceFlag.FLIP_SUMMONED,
  sp_summoning: ReplayAdvanceFlag.SP_SUMMONING,
  sp_summoned: ReplayAdvanceFlag.SP_SUMMONED,
  chaining: ReplayAdvanceFlag.CHAINING,
  chain_solved: ReplayAdvanceFlag.CHAIN_SOLVED,
  chain_end: ReplayAdvanceFlag.CHAIN_END,
  attack: ReplayAdvanceFlag.ATTACK,
  battle: ReplayAdvanceFlag.ATTACK,
  pos_change: ReplayAdvanceFlag.POS_CHANGE,
  update_hp: ReplayAdvanceFlag.UPDATE_HP,
  win: ReplayAdvanceFlag.WIN,
  become_target: ReplayAdvanceFlag.BECOME_TARGET,
  reload_field: ReplayAdvanceFlag.RELOAD_FIELD,
  shuffle_hand_extra: ReplayAdvanceFlag.SHUFFLE_HAND_EXTRA,
  shuffle_set_card: ReplayAdvanceFlag.SHUFFLE_SET_CARD,
  field_disabled: ReplayAdvanceFlag.FIELD_DISABLED,
  confirm_cards: ReplayAdvanceFlag.CONFIRM_CARDS,
  update_counter: ReplayAdvanceFlag.UPDATE_COUNTER,
  update_data: ReplayAdvanceFlag.UPDATE_DATA,
  shuffle_deck: ReplayAdvanceFlag.DECK,
};

export interface ReplayPlaybackState {
  isReplay: boolean;
  paused: boolean;
  waiting: boolean;
  /** 当前正在执行或已完成的消息索引；-1 表示尚未执行消息。 */
  currentIndex: number;
  total: number;
  /** 从请求定位到界面渲染确认的整个过程，期间暂停普通推进。 */
  seeking: boolean;
  /** 正在从开局执行协议消息；界面暂时卸载牌面，重建后重新挂载。 */
  rebuilding: boolean;
  /** 协议状态已重建，正在等待界面确认牌面渲染完成。 */
  renderPending: boolean;
  ended: boolean;
  speed: number;
  swapped: boolean;
  /** 定位或取消时递增，用于忽略旧消息和旧界面的渲染确认。 */
  revision: number;
  keyframes: number[];
  turns: number[];
}

export interface ReplayInputSession {
  execute(dispatch: (index: number) => Promise<void>): Promise<void>;
  close(): void;
  isClosed(): boolean;
}

interface SeekRequest {
  index: number;
  revision: number;
  resolve: (completed: boolean) => void;
}

interface PlaybackSession {
  closed: boolean;
  cursor: number;
  reset: () => void;
  seek?: SeekRequest;
  wake?: () => void;
}

/** 管理推进、定位重建与渲染确认，输入负责分发消息，界面负责确认渲染。 */
export class ReplayPlayback {
  private state: ReplayPlaybackState;
  private presentation: { seeking: boolean; speed: number };
  private delay: (duration: number) => Promise<void>;
  private session?: PlaybackSession;
  private activeAdvanceMask?: number;
  private advanceResolvers: (() => void)[] = [];
  private renderWait?: {
    revision: number;
    resolve: (completed: boolean) => void;
  };
  private seekRequest?: SeekRequest;
  private cancelPresentation: () => void;

  constructor(
    state: ReplayPlaybackState,
    presentation: { seeking: boolean; speed: number },
    delay: (duration: number) => Promise<void>,
    cancelPresentation: () => void = () => {},
  ) {
    this.state = state;
    this.presentation = presentation;
    this.delay = delay;
    this.cancelPresentation = cancelPresentation;
  }

  begin() {
    this.cancel();
    Object.assign(this.state, {
      isReplay: true,
      paused: false,
      waiting: false,
      currentIndex: -1,
      total: 0,
      ended: false,
      swapped: false,
      keyframes: [],
      turns: [],
    });
  }

  setTimeline(messages: (string | undefined)[]) {
    this.state.keyframes = messages.flatMap((msg, index) =>
      matchesAdvanceMask(DEFAULT_REPLAY_ADVANCE_MASK, msg) ? [index] : [],
    );
    this.state.turns = messages.flatMap((msg, index) =>
      msg === "new_turn" ? [index] : [],
    );
  }

  setSpeed(speed: number) {
    if (![0.5, 1, 1.5, 2, 4].includes(speed)) return;
    this.state.speed = speed;
    this.presentation.speed = speed;
  }

  /** 每个输入拥有独立会话；关闭旧输入时不得影响后来打开的录像。 */
  open(total: number, reset: () => void): ReplayInputSession {
    if (this.session) this.closeSession(this.session);
    const session: PlaybackSession = { closed: false, cursor: 0, reset };
    this.session = session;
    this.state.total = total;
    return {
      execute: (dispatch) => this.execute(session, dispatch),
      close: () => this.closeSession(session),
      isClosed: () => session.closed,
    };
  }

  /** 从开局重建并执行目标消息，渲染完成返回 true，取消或无法定位返回 false。 */
  seek(index: number): Promise<boolean> {
    if (!this.canSeek() || !Number.isFinite(index))
      return Promise.resolve(false);
    const target = Math.max(
      0,
      Math.min(this.state.total - 1, Math.trunc(index)),
    );
    this.state.paused = true;
    this.state.seeking = true;
    this.state.ended = false;
    this.presentation.seeking = true;
    this.cancelPresentation();
    this.state.revision += 1;
    this.activeAdvanceMask = undefined;
    const promise = new Promise<boolean>((resolve) => {
      const request = { index: target, revision: this.state.revision, resolve };
      this.seekRequest = request;
      this.session!.seek = request;
    });
    // 唤醒暂停或文件结束处的等待，execute 会在当前 handler 完成后处理定位。
    this.releaseAll();
    this.session!.wake?.();
    return promise;
  }

  previous() {
    const previous = this.state.keyframes
      .filter((index) => index < this.state.currentIndex)
      .at(-1);
    return this.seek(previous ?? 0);
  }

  restart() {
    return this.seek(this.state.keyframes[0] ?? 0);
  }

  nextTurn() {
    return this.seek(
      this.state.turns.find((index) => index > this.state.currentIndex) ??
        this.state.total - 1,
    );
  }

  swapView() {
    if (!this.canSeek()) return Promise.resolve(false);
    this.state.swapped = !this.state.swapped;
    return this.seek(Math.max(0, this.state.currentIndex));
  }

  finishRender(revision: number) {
    // 页面可能留下上一轮的动画帧回调，只接受本次定位的渲染确认。
    if (
      revision !== this.state.revision ||
      revision !== this.renderWait?.revision
    )
      return;
    this.state.renderPending = false;
    this.renderWait.resolve(true);
    this.renderWait = undefined;
  }

  cancel() {
    this.cancelPresentation();
    if (this.session) {
      this.session.closed = true;
      this.session.wake?.();
      this.session = undefined;
    }
    // 让旧 handler 失效，并结束定位、渲染和推进等待，避免退出后留下悬挂任务。
    this.state.revision += 1;
    this.seekRequest?.resolve(false);
    this.seekRequest = undefined;
    this.renderWait?.resolve(false);
    this.renderWait = undefined;
    this.state.renderPending = false;
    this.state.seeking = false;
    this.state.rebuilding = false;
    this.presentation.seeking = false;
    this.activeAdvanceMask = undefined;
    this.releaseAll();
    this.setSpeed(1);
  }

  pause() {
    if (this.state.isReplay) this.state.paused = true;
  }

  resume() {
    if (!this.state.isReplay || this.state.seeking || this.state.ended) return;
    this.state.paused = false;
    this.activeAdvanceMask = undefined;
    this.releaseAll();
  }

  /** 暂停时继续处理消息，执行到匹配掩码的动作后再次等待。 */
  advance(advanceMask = DEFAULT_REPLAY_ADVANCE_MASK) {
    if (
      !this.state.isReplay ||
      !this.state.paused ||
      this.state.seeking ||
      this.state.ended
    )
      return;
    this.activeAdvanceMask =
      Number.isFinite(advanceMask) && advanceMask > 0 ? advanceMask : undefined;
    const resolve = this.advanceResolvers.shift();
    resolve?.();
    this.state.waiting = this.advanceResolvers.length > 0;
  }

  async handleMessage(
    gameMsg: string | undefined,
    handler: () => Promise<void>,
    isCancelled = () => false,
  ) {
    const revision = this.state.revision;
    await this.waitForAdvance();
    if (isCancelled() || revision !== this.state.revision) return false;
    // 动画开始前记录进度，上一步才能退到屏幕上当前动作之前。
    this.state.currentIndex += 1;
    await handler();
    if (isCancelled() || revision !== this.state.revision) return false;
    if (
      this.activeAdvanceMask !== undefined &&
      matchesAdvanceMask(this.activeAdvanceMask, gameMsg)
    )
      this.activeAdvanceMask = undefined;
    return true;
  }

  private canSeek() {
    return (
      this.state.isReplay &&
      !this.state.seeking &&
      this.session !== undefined &&
      this.state.total > 0
    );
  }

  private async waitForAdvance() {
    if (!this.state.isReplay || !this.state.paused || this.state.seeking)
      return;
    if (this.activeAdvanceMask !== undefined) {
      this.state.waiting = false;
      return;
    }
    this.state.waiting = true;
    await new Promise<void>((resolve) => this.advanceResolvers.push(resolve));
    this.state.waiting = this.advanceResolvers.length > 0;
  }

  private async execute(
    session: PlaybackSession,
    dispatch: (index: number) => Promise<void>,
  ) {
    try {
      while (this.session === session && !session.closed) {
        if (session.seek) {
          const request = session.seek;
          session.seek = undefined;
          // 当前 handler 已结束，才卸载牌面并从开局重建协议状态。
          this.state.rebuilding = true;
          session.reset();
          this.state.currentIndex = -1;
          // 包含目标消息本身，完成时牌面应显示该动作执行后的状态。
          for (
            let index = 0;
            index <= request.index &&
            this.session === session &&
            !session.closed;
            index++
          ) {
            await dispatch(index);
            // 重建跳过演出，定期交还事件循环，长录像仍能响应退出操作。
            if (index % 200 === 0) await this.delay(0);
          }
          if (this.session !== session || session.closed) return;
          session.cursor = request.index + 1;
          // 状态恢复不等于 DOM 已更新；保持 seeking，直到界面明确确认渲染。
          const rendered = new Promise<boolean>((resolve) => {
            this.renderWait = { revision: request.revision, resolve };
          });
          this.state.renderPending = true;
          this.state.rebuilding = false;
          if (!(await rendered) || this.session !== session || session.closed)
            return;
          this.state.currentIndex = request.index;
          this.state.seeking = false;
          this.state.paused = true;
          this.state.waiting = true;
          this.presentation.seeking = false;
          this.seekRequest = undefined;
          request.resolve(true);
          continue;
        }
        if (session.cursor >= this.state.total) {
          // 文件结束后保留牌面和输入会话，等待回退、重新播放或关闭。
          this.state.ended = true;
          this.state.paused = true;
          this.state.waiting = true;
          await new Promise<void>((resolve) => {
            session.wake = resolve;
          });
          session.wake = undefined;
          continue;
        }
        await this.delay(10 / this.state.speed);
        if (this.session !== session || session.closed || session.seek)
          continue;
        await dispatch(session.cursor);
        if (!session.seek) session.cursor += 1;
      }
    } catch (error) {
      this.closeSession(session);
      throw error;
    }
  }

  private closeSession(session: PlaybackSession) {
    session.closed = true;
    session.wake?.();
    // 旧输入会话的关闭不能释放或重置新会话的等待。
    if (this.session === session) this.cancel();
  }

  private releaseAll() {
    this.advanceResolvers.splice(0).forEach((resolve) => resolve());
    this.state.waiting = false;
  }
}

const matchesAdvanceMask = (advanceMask: number, gameMsg?: string) => {
  if (!gameMsg) return false;
  const flag = GAME_MSG_ADVANCE_FLAGS[gameMsg];
  return flag !== undefined && (advanceMask & flag) !== 0;
};
