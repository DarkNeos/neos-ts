// web平台上websocket的消息到达是保序的，但是不能保证对这些消息的逻辑处理是保序的。
// 现在我们有这样一个需求：需要保证每次只处理一个消息，在上一个消息处理完后，再进行下一个消息的处理。
//
// 因此封装了一个`WebSocketStream`类，当每次Websocket连接中有消息到达时，往流中添加event，

import { useConfig } from "@/config";

import { sleep } from "./sleep";

// 同时执行器会不断地从流中获取event进行处理。
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
          // websocket not closed, wait some time, and then handle next message from server

          await sleep(useConfig().streamInterval);
          await reader.read().then(process);
        }
      }

      if (value) {
        await onMessage(value);
      } else {
        console.warn("value from ReadableStream is undefined!");
      }

      // read some more, and call process function again
      await reader.read().then(process);
    });
  }

  // 关闭流
  close() {
    this.ws.close();
  }
}
