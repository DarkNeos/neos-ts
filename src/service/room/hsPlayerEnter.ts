import { ygopro } from "@/api";
import { roomStore } from "@/stores";

export default function handleHsPlayerEnter(pb: ygopro.YgoStocMsg) {
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
