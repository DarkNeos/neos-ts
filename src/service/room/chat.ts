import { ygopro } from "@/api";
import { AudioActionType, playEffect } from "@/infra/audio";
import { chatStore } from "@/stores";

export default function handleChat(pb: ygopro.YgoStocMsg) {
  playEffect(AudioActionType.SOUND_CHAT);
  const chat = pb.stoc_chat;
  chatStore.message = chat.msg;
  chatStore.sender = chat.player;
}
