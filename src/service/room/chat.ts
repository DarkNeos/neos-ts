import { ygopro } from "@/api";
import { postChat } from "@/reducers/chatSlice";
import { store } from "@/store";
import { chatStore } from "@/valtioStores";

export default function handleChat(pb: ygopro.YgoStocMsg) {
  // const dispatch = store.dispatch;

  const chat = pb.stoc_chat;
  // dispatch(postChat(chat.msg));

  chatStore.message = chat.msg;
}
