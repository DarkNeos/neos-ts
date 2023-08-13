import { proxy } from "valtio";

import { type NeosStore } from "./shared";

export interface ChatState extends NeosStore {
  sender: number;
  message: string;
}

export const chatStore = proxy<ChatState>({
  sender: -1,
  message: "",
  reset() {
    chatStore.message = "";
  },
});
