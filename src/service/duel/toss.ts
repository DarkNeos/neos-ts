import { fetchStrings, Region, ygopro } from "@/api";
import { duelAnimation } from "@/infra/duelAnimation";
import { presentationDelay } from "@/infra/presentationDelay";
import MsgToss = ygopro.StocGameMessage.MsgToss;
import { Container } from "@/container";
import { AudioActionType, playEffect } from "@/infra/audio";

export default async (container: Container, toss: MsgToss) => {
  const context = container.context;
  const player = toss.player;
  const tossType = toss.toss_type;

  const prefix = fetchStrings(
    Region.System,
    context.matStore.isMe(player) ? 102 : 103,
  );

  for (const x of toss.res) {
    if (container.conn.cancelled || container.conn.isClosed()) return;
    if (tossType === MsgToss.TossType.DICE) {
      playEffect(AudioActionType.SOUND_DICE);
      context.matStore.tossResult =
        prefix + fetchStrings(Region.System, 1624) + x;
    } else if (tossType === MsgToss.TossType.COIN) {
      playEffect(AudioActionType.SOUND_COIN);
      context.matStore.tossResult =
        prefix +
        fetchStrings(Region.System, 1623) +
        fetchStrings(Region.System, 61 - x);
    } else {
      console.log(`Unknown tossType = ${tossType}`);
    }

    await presentationDelay(duelAnimation.toss);
  }
};
