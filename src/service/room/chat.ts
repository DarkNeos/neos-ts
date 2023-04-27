import { ygopro } from "@/api";
import { chatStore } from "@/stores";

export default function handleChat(pb: ygopro.YgoStocMsg) {
  const chat = pb.stoc_chat;
  chatStore.message = chat.msg;
}
