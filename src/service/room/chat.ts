import { ygopro } from "@/api";
import { Container } from "@/container";
import { AudioActionType, playEffect } from "@/infra/audio";

export default function handleChat(
  container: Container,
  pb: ygopro.YgoStocMsg,
) {
  playEffect(AudioActionType.SOUND_CHAT);
  const context = container.context;
  const chat = pb.stoc_chat;
  context.chatStore.message = chat.msg;
  context.chatStore.sender = chat.player;
}
