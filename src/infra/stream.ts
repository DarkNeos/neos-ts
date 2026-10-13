export type SocketState = "open" | "closed" | "error";

/** 允许域名、端口和路径，默认使用 WSS，与 HTTPS 页面要求保持一致。 */
export function normalizeWebSocketAddress(address: string): string {
  const value = address.trim();
  if (!value) throw new Error("请输入服务器地址");
  if (/\s|\\/.test(value) || value.startsWith("/"))
    throw new Error(
      "服务器地址格式不正确，请输入域名:端口或完整的 wss:// 地址",
    );
  let url: URL;
  try {
    url = new URL(value.includes("://") ? value : `wss://${value}`);
  } catch {
    throw new Error("服务器地址格式不正确，请检查域名和端口（1–65535）");
  }
  if (url.protocol === "ws:")
    throw new Error(
      "本站仅支持 wss:// 安全连接，浏览器会阻止 HTTPS 页面连接 ws:// 服务器",
    );
  if (url.protocol !== "wss:")
    throw new Error(
      "请输入 wss:// WebSocket 地址，不能使用 http:// 或 https:// 网页地址",
    );
  if (
    !url.hostname ||
    (!url.hostname.startsWith("[") &&
      !/^[a-z\d](?:[a-z\d-]*[a-z\d])?(?:\.[a-z\d](?:[a-z\d-]*[a-z\d])?)*\.?$/i.test(
        url.hostname,
      )) ||
    url.port === "0" ||
    url.username ||
    url.password ||
    url.hash
  )
    throw new Error(
      "请使用有效的服务器域名和端口，地址中不能包含账号、密码或 # 片段",
    );
  return url.href;
}

/** 按序消费协议消息；服务器正常关闭时处理已收消息，主动关闭或出错时停止。 */
export class WebSocketStream {
  public ws: WebSocket;
  stream: ReadableStream<MessageEvent>;
  readonly opened: Promise<void>;
  // 主动取消与服务器断线分别处理，避免退出页面后仍执行已排队的对局操作。
  private deliberateClose = false;

  get cancelled() {
    return this.deliberateClose;
  }

  constructor(
    ip: string,
    onWsOpen?: (conn: WebSocketStream, ev: Event) => any,
    onState?: (state: SocketState, message?: string) => void,
    onReceive?: (event: MessageEvent) => void,
  ) {
    this.ws = new WebSocket(normalizeWebSocketAddress(ip));
    this.ws.binaryType = "arraybuffer";
    const ws = this.ws;
    let resolveOpen: () => void;
    let rejectOpen: (reason: Error) => void;
    let settled = false;
    this.opened = new Promise<void>((resolve, reject) => {
      resolveOpen = resolve;
      rejectOpen = reject;
    });
    // 调用方可能先初始化容器，再等待连接，提前捕获可避免未处理拒绝。
    void this.opened.catch(() => undefined);
    const failOpen = (message: string) => {
      if (!settled) {
        settled = true;
        rejectOpen(new Error(message));
      }
    };
    const timeout = setTimeout(() => {
      failOpen("连接超时，请检查网络后重试");
      onState?.("error", "连接超时，请检查网络后重试");
      this.close();
    }, 15_000);
    this.stream = new ReadableStream<MessageEvent>({
      start: (controller) => {
        ws.onopen = (event) => {
          clearTimeout(timeout);
          if (this.deliberateClose) {
            ws.close();
            return;
          }
          try {
            onWsOpen?.(this, event);
            settled = true;
            resolveOpen();
            onState?.("open");
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "加入房间失败";
            failOpen(message);
            onState?.("error", message);
            this.close();
          }
        };
        ws.onmessage = (event) => {
          if (this.deliberateClose) return;
          try {
            // 录像保存等接收工作不等待动画或结算弹窗。
            onReceive?.(event);
            controller.enqueue(event);
          } catch (error) {
            onState?.(
              "error",
              error instanceof Error ? error.message : "对局数据接收失败",
            );
            this.close();
          }
        };
        ws.onerror = () => {
          clearTimeout(timeout);
          const message = "无法连接服务器，请检查网络或稍后重试";
          failOpen(message);
          if (!this.deliberateClose) onState?.("error", message);
          this.close();
        };
        ws.onclose = () => {
          clearTimeout(timeout);
          failOpen("连接已关闭");
          controller.close();
          if (!this.deliberateClose)
            onState?.("closed", "连接已断开，当前对局无法继续发送操作");
        };
      },
    });
  }

  async execute(onMessage: (event: MessageEvent) => Promise<void>) {
    const reader = this.stream.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done || this.deliberateClose) return;
        await onMessage(value);
      }
    } finally {
      reader.releaseLock();
    }
  }

  close() {
    this.deliberateClose = true;
    this.ws.close();
  }

  isClosed(): boolean {
    return (
      this.ws.readyState === WebSocket.CLOSED ||
      this.ws.readyState === WebSocket.CLOSING
    );
  }
}
