import { proxy } from "valtio";

import { NeosStore } from "./shared";

export interface ChatState extends NeosStore {
  message: string;
}

export const chatStore = proxy<ChatState>({
  message: "",
  reset() {
    chatStore.message = "";
  },
});
