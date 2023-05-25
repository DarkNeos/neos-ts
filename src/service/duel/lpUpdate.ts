import { ygopro } from "@/api";
import { matStore } from "@/stores";

export default (lpUpdate: ygopro.StocGameMessage.MsgLpUpdate) => {
  const player = lpUpdate.player;
  const newLp = lpUpdate.new_lp;
  matStore.initInfo.of(player).life = newLp;
};
