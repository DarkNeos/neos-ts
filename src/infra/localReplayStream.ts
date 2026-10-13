import type { ReplayInputSession } from "@/stores/replayPlayback";
import { replayPlayback } from "@/stores/replayStore";

// 复用协议处理函数所需的 Socket 接口，录像中的选卡等响应无需发送到服务器。
class LocalReplaySocket {
  binaryType: BinaryType = "arraybuffer";
  readyState: number = WebSocket.OPEN;
  send(_data: Parameters<WebSocket["send"]>[0]) {
    return undefined;
  }
  close() {
    this.readyState = WebSocket.CLOSED;
  }
}

/** 将文件消息包装为 MessageEvent，播放进度和关闭等待统一交给 ReplayPlayback。 */
export class LocalReplayStream {
  public ws = new LocalReplaySocket() as unknown as WebSocket;
  stream = new ReadableStream();
  private session: ReplayInputSession;
  private messages: ArrayBuffer[];

  constructor(messages: ArrayBuffer[], reset: () => void) {
    this.messages = messages;
    this.session = replayPlayback.open(messages.length, reset);
  }

  get cancelled() {
    return this.session.isClosed();
  }

  execute(onMessage: (event: MessageEvent) => Promise<void>) {
    return this.session.execute((index) =>
      onMessage(new MessageEvent("message", { data: this.messages[index] })),
    );
  }

  close() {
    this.ws.close();
    this.session.close();
  }

  isClosed() {
    return this.cancelled;
  }
}
