import { ygopro } from "@/api";
import { playerStore } from "@/stores";

export default function handleHsPlayerEnter(pb: ygopro.YgoStocMsg) {
  const name = pb.stoc_hs_player_enter.name;
  const pos = pb.stoc_hs_player_enter.pos;

  if (pos > 1) {
    console.log("Currently only supported 2v2 mode.");
  } else {
    playerStore[pos == 0 ? "player0" : "player1"].name = name;
  }
}
