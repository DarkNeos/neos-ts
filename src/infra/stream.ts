import handleSocketMessage from "@/service/onSocketMessage";

import { sleep } from "./sleep";

const SLEEP_INTERVAL = 200;

export class WebSocketStream {
  public ws: WebSocket;
  stream: ReadableStream;

  constructor(ip: string, onWsOpen?: (ws: WebSocket, ev: Event) => any) {
    this.ws = new WebSocket("wss://" + ip);
    if (onWsOpen) {
      this.ws.onopen = (e) => onWsOpen(this.ws, e);
    }

    const ws = this.ws;
    this.stream = new ReadableStream({
      start(controller) {
        // 当Websocket有数据到达时，加入队列
        ws.onmessage = (event) => {
          controller.enqueue(event);
        };
        ws.onclose = () => {
          console.info("Websocket closed.");
          controller.close();
        };
      },
      pull(_) {
        // currently not really need
      },
      cancel() {
        // currently not
      },
    });
  }

  // 异步地从Websocket中获取数据并处理
  async execute(onMessage: (event: MessageEvent) => Promise<void>) {
    const reader: ReadableStreamDefaultReader<MessageEvent> =
      this.stream.getReader();
    const ws = this.ws;

    reader.read().then(async function process({ done, value }): Promise<void> {
      if (done) {
        if (ws.readyState == WebSocket.CLOSED) {
          // websocket connection has been closed
          console.info("WebSocket closed, stream complete.");

          return;
        } else {
          // websocket not closed, sleep sometime, wait for next message from server
          await sleep(SLEEP_INTERVAL);

          return reader.read().then(process);
        }
      }

      if (value) {
        await onMessage(value);
      } else {
        console.warn("value from ReadableStream is undefined!");
      }

      // read some more, and call process function again
      return reader.read().then(process);
    });
  }

  // 关闭流
  close() {
    this.ws.close();
  }
}
