import { proxy } from "valtio";

export interface ChatState {
  message: string;
}

export const chatStore = proxy<ChatState>({
  message: "",
});
