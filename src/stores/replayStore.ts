import { proxy, ref, subscribe } from "valtio";
import {
  YGOProStocHsPlayerChange,
  YGOProStocHsPlayerEnter,
  YGOProStocTypeChange,
} from "ygopro-msg-encode";
import { writeYrp3dPackets } from "ygopro-yrp3d-encode";

import { YgoProPacket } from "@/api/ocgcore/ocgAdapter/packet";
import {
  MSG_SIBYL_NAME,
  MSG_START,
  STOC_GAME_MSG,
  STOC_HS_PLAYER_CHANGE,
  STOC_HS_PLAYER_ENTER,
  STOC_REPLAY,
  STOC_TYPE_CHANGE,
} from "@/api/ocgcore/ocgAdapter/protoDecl";
import type { ReplayDeck } from "@/api/ocgcore/replayDecks";
import { replayPresentation } from "@/infra/replayPresentation";
import { sleep } from "@/infra/sleep";

import { resetDuelDialogs } from "./duelDialogs";
import { DEFAULT_REPLAY_ADVANCE_MASK, ReplayPlayback } from "./replayPlayback";
import { type NeosStore } from "./shared";

export {
  DEFAULT_REPLAY_ADVANCE_MASK,
  ReplayAdvanceFlag,
} from "./replayPlayback";

// 对局中每一次状态改变的记录
interface ReplaySpot {
  packet: ReplayPacket; // 将会保存在回放文件中的数据
}

// 保存回放信息的数据包
interface ReplayPacket {
  func: number; // 内部 GAME_MSG 消息号或服务器录像记录号
  extraData: ArrayBuffer;
}

// 保存对局回放数据的`Store`
class ReplayStore implements NeosStore {
  private recordingFilename?: string;
  private recordingPlayers: (string | undefined)[] = [];
  private recordingSeat?: number;
  recordedCount = 0;
  recordedGames = 0;
  serverReplays = 0;
  lastReplay: { buffers: ArrayBuffer[]; filename: string } | null = null;
  /** 保留当前录像的快照，离开对局清空记录后仍可下载最后一份。 */
  archive() {
    if (!this.isReplay && this.inner.length) {
      this.recordingFilename ??= `${new Date()
        .toISOString()
        .replace(/[:.]/g, "-")}.neos.yrp3d`;
      this.lastReplay = ref({
        buffers: this.encode(),
        filename: this.recordingFilename,
      });
    }
  }

  download() {
    this.archive();
    if (!this.lastReplay) return;
    const url = URL.createObjectURL(
      new Blob(this.lastReplay.buffers, { type: "application/octet-stream" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = this.lastReplay.filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /** 等待已录制各局的服务器录像，其中包含本地动作记录没有的完整卡组信息。 */
  async waitForServerReplay() {
    if (this.serverReplays >= this.recordedGames) return true;
    // 固定本次等待的局数；记录被重置时及时结束，避免继续等待旧对局。
    const games = this.recordedGames;
    return new Promise<boolean>((resolve) => {
      const finish = (complete: boolean) => {
        clearTimeout(timer);
        unsubscribe();
        resolve(complete);
      };
      const unsubscribe = subscribe(replayStore, () => {
        if (this.serverReplays >= games) finish(true);
        else if (this.recordedGames < games) finish(false);
      });
      // 预留浏览器响应保存点击并发起下载的时间。
      const timer = setTimeout(() => finish(false), 4000);
    });
  }

  isReplay: boolean = false; // 是否进入了回放模式
  playbackReady = false;
  paused: boolean = false;
  waiting: boolean = false;
  currentIndex: number = -1;
  inner: ReplaySpot[] = ref([]);
  total = 0;
  seeking = false;
  rebuilding = false;
  renderPending = false;
  ended = false;
  speed = 1;
  swapped = false;
  revision = 0;
  keyframes: number[] = ref([]);
  turns: number[] = ref([]);
  decks: ReplayDeck[] = [];
  deckError = "";
  game = 0;

  setTimeline(messages: (string | undefined)[]) {
    replayPlayback.setTimeline(messages);
  }

  setSpeed(speed: number) {
    replayPlayback.setSpeed(speed);
  }

  seek(index: number) {
    return replayPlayback.seek(index);
  }

  previous() {
    return replayPlayback.previous();
  }

  restart() {
    return replayPlayback.restart();
  }

  nextTurn() {
    return replayPlayback.nextTurn();
  }

  swapView() {
    return replayPlayback.swapView();
  }

  finishRender(revision: number) {
    replayPlayback.finishRender(revision);
  }

  cancelPlayback() {
    replayPlayback.cancel();
  }

  beginReplay() {
    this.playbackReady = false;
    replayPlayback.begin();
    this.game = 0;
  }

  /** 在网络接收时保存原始消息，记录不受动画、选卡等待或结算弹窗影响。 */
  record(ygoPacket: YgoProPacket) {
    // 房间消息和开局可能在同一批到达，不能依赖尚未处理完的界面状态。
    if (ygoPacket.proto === STOC_HS_PLAYER_ENTER) {
      const { pos, name } = new YGOProStocHsPlayerEnter().fromPayload(
        ygoPacket.exData,
      );
      this.recordingPlayers[pos & 3] = name;
      return;
    }
    if (ygoPacket.proto === STOC_TYPE_CHANGE) {
      this.recordingSeat = new YGOProStocTypeChange().fromPayload(
        ygoPacket.exData,
      ).playerPosition;
      return;
    }
    if (ygoPacket.proto === STOC_HS_PLAYER_CHANGE) {
      const { status } = new YGOProStocHsPlayerChange().fromPayload(
        ygoPacket.exData,
      );
      const from = status >> 4;
      const to = status & 15;
      if (from < 4 && to < 4) {
        const name = this.recordingPlayers[from];
        this.recordingPlayers[from] = undefined;
        this.recordingPlayers[to] = name;
        if (this.recordingSeat === from) this.recordingSeat = to;
      } else if (to === 8 || to === 11) {
        this.recordingPlayers[from] = undefined;
      }
      return;
    }
    if (![STOC_GAME_MSG, STOC_REPLAY].includes(ygoPacket.proto)) return;
    if (ygoPacket.proto === STOC_GAME_MSG && ygoPacket.exData[0] === MSG_START)
      this.recordedGames += 1;
    if (ygoPacket.proto === STOC_REPLAY) this.serverReplays += 1;
    this.recordedCount += 1;
    this.inner.push({
      packet: ygoPacket2replayPacket(ygoPacket),
    });
    if (ygoPacket.proto === STOC_GAME_MSG && ygoPacket.exData[0] === MSG_START)
      this.recordPlayerNames(ygoPacket.exData[1]);
  }

  private recordPlayerNames(playerType: number) {
    // 名称记录按先后攻排列；观战开局的低位表示首个席位的先后攻。
    const seat = playerType & 0xf0 ? 0 : this.recordingSeat;
    if (seat !== 0 && seat !== 1) return;
    const first = seat ^ (playerType & 1);
    const host = this.recordingPlayers[first];
    const client = this.recordingPlayers[1 - first];
    if (!host || !client) return;
    // 复用 YRP3D 的姓名消息，开局之后恢复名字；退出时清空房间不影响已录内容。
    const payload = new Uint8Array(600);
    const view = new DataView(payload.buffer);
    [host, "", host, client, "", client].forEach((name, index) => {
      for (let i = 0; i < Math.min(name.length, 49); i++)
        view.setUint16(index * 100 + i * 2, name.charCodeAt(i), true);
    });
    this.inner.push({
      packet: { func: MSG_SIBYL_NAME, extraData: payload.buffer },
    });
  }

  pause() {
    replayPlayback.pause();
  }

  resume() {
    replayPlayback.resume();
  }

  advance(advanceMask = DEFAULT_REPLAY_ADVANCE_MASK) {
    replayPlayback.advance(advanceMask);
  }

  advanceToNextKey() {
    replayPlayback.advance();
  }

  advanceTo(advanceMask: number) {
    replayPlayback.advance(advanceMask);
  }

  encode(): ArrayBuffer[] {
    return [
      writeYrp3dPackets(
        this.inner.map(({ packet }) => ({
          type: packet.func,
          payload: new Uint8Array(packet.extraData),
        })),
      ).slice().buffer as ArrayBuffer,
    ];
  }
  reset() {
    this.archive();
    this.recordedCount = 0;
    this.recordedGames = 0;
    this.serverReplays = 0;
    this.decks = [];
    this.deckError = "";
    this.cancelPlayback();
    this.total = 0;
    this.ended = false;
    this.swapped = false;
    this.recordingFilename = undefined;
    this.recordingPlayers = [];
    this.recordingSeat = undefined;
    this.inner.splice(0);
    this.isReplay = false;
    this.playbackReady = false;
    this.paused = false;
    this.waiting = false;
    this.currentIndex = -1;
  }
}

// 231 是文件格式中的服务器录像记录号；GAME_MSG 则保存内部消息号与后续数据。
const ygoPacket2replayPacket = (ygoPacket: YgoProPacket) => ({
  func: ygoPacket.proto === STOC_REPLAY ? 231 : ygoPacket.exData[0],
  extraData:
    ygoPacket.proto === STOC_REPLAY
      ? ygoPacket.exData.slice()
      : ygoPacket.exData.slice(1),
});

export const replayStore = proxy(new ReplayStore());
// 必须写入实际的 proxy，才能让定位进度和渲染等待通知界面。
export const replayPlayback = new ReplayPlayback(
  replayStore,
  replayPresentation,
  async (duration) => {
    await sleep(duration);
  },
  resetDuelDialogs,
);
