import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import { postChat } from "../../reducers/chatSlice";
import { store } from "../../store";

export default function handleChat(pb: ygopro.YgoStocMsg) {
  const dispatch = store.dispatch;

  const chat = pb.stoc_chat;
  dispatch(postChat(chat.msg));
}
