import { getStrings, ygopro } from "@/api";
import { messageStore } from "@/stores";

type MsgSelectYesNo = ygopro.StocGameMessage.MsgSelectYesNo;

export default async (selectYesNo: MsgSelectYesNo) => {
  const player = selectYesNo.player;
  const effect_description = selectYesNo.effect_description;

  messageStore.yesNoModal.msg = await getStrings(effect_description);
  messageStore.yesNoModal.isOpen = true;
};
