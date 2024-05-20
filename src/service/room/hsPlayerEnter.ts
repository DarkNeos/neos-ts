import { ygopro } from "@/api";
import { AudioActionType, playEffect } from "@/infra/audio";
import { roomStore } from "@/stores";

export default function handleHsPlayerEnter(pb: ygopro.YgoStocMsg) {
  playEffect(AudioActionType.SOUND_PLAYER_ENTER);
  const name = pb.stoc_hs_player_enter.name;
  const pos = pb.stoc_hs_player_enter.pos;

  const player = roomStore.players[pos];

  if (player) {
    player.name = name;
  } else {
    roomStore.players[pos] = {
      name,
      state: ygopro.StocHsPlayerChange.State.NO_READY,
    };
  }
}
