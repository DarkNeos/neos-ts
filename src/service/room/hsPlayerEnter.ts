import { ygopro } from "@/api";
import { Container } from "@/container";
import { AudioActionType, playEffect } from "@/infra/audio";

export default function handleHsPlayerEnter(
  container: Container,
  pb: ygopro.YgoStocMsg,
) {
  playEffect(AudioActionType.SOUND_PLAYER_ENTER);
  const name = pb.stoc_hs_player_enter.name;
  const pos = pb.stoc_hs_player_enter.pos;
  const context = container.context;

  const player = context.roomStore.players[pos];

  if (player) {
    player.name = name;
  } else {
    context.roomStore.players[pos] = {
      name,
      state: ygopro.StocHsPlayerChange.State.NO_READY,
    };
  }
}
