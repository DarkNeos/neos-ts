import { proxy } from "valtio";

import type { IDeck } from "./deckStore";
import type { NeosStore } from "./shared";

/** 训练配置；服务器由内部设置提供，界面只允许调整开局规则。 */
export interface TrainingOptions {
  server: string;
  first: boolean;
  noShuffle: boolean;
  handSize: number;
}

/** 保存本次使用的编辑中卡组，重开训练时沿用同一份快照。 */
export interface TrainingSession extends TrainingOptions {
  deck: IDeck;
}

/** 连接、准备和对局共用的训练状态，随会话结束一起清理。 */
export class TrainingStore implements NeosStore {
  session?: TrainingSession;
  /** 防止服务端重复发送身份消息时重复提交卡组和准备。 */
  readySent = false;
  /** 保存退出时等待服务器录像，结算消息暂不触发页面跳转。 */
  savingReplay = false;
  /** 保留规则校验错误，让断线提示显示具体的训练失败原因。 */
  error = "";

  /** 复制卡组数组，避免编辑器后续调整顺序影响已经开始的训练。 */
  start(session: TrainingSession) {
    this.reset();
    this.session = {
      ...session,
      deck: {
        ...session.deck,
        main: [...session.deck.main],
        extra: [...session.deck.extra],
        side: [...session.deck.side],
      },
    };
  }

  /** 清理训练专属状态，避免普通匹配沿用上次的自动准备流程。 */
  reset() {
    this.session = undefined;
    this.readySent = false;
    this.savingReplay = false;
    this.error = "";
  }
}

export const trainingStore = proxy(new TrainingStore());
