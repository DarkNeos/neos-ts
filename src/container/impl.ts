import { WebSocketStream } from "@/infra";

import { Context } from "./context";

export class Container {
  public context: Context;
  public conn: WebSocketStream;

  // ref: https://yugioh.fandom.com/wiki/Kuriboh
  private enableKuriboh: boolean = false;

  constructor(context: Context, conn: WebSocketStream) {
    this.context = context;
    this.conn = conn;
  }

  public setEnableKuriboh(value: boolean) {
    this.enableKuriboh = value;
  }

  public getEnableKuriboh(): boolean {
    return this.enableKuriboh;
  }
}
