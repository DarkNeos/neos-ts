import { proxy } from "valtio";

import { type NeosStore } from "./shared";

export class ChatStore implements NeosStore {
  sender: number = -1;
  message: string = "";

  reset(): void {
    this.message = "";
  }
}

export const chatStore = proxy<ChatStore>(new ChatStore());
