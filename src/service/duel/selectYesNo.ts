import { getStrings, ygopro } from "@/api";
import { displayYesNoModal } from "@/ui/Duel/Message";

type MsgSelectYesNo = ygopro.StocGameMessage.MsgSelectYesNo;

export default async (selectYesNo: MsgSelectYesNo) => {
  const _player = selectYesNo.player;
  const effect_description = selectYesNo.effect_description;

  const msg = getStrings(effect_description);
  await displayYesNoModal(msg);
};
