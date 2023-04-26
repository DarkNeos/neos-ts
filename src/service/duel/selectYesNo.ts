import { getStrings, ygopro } from "@/api";
import { setYesNoModalIsOpen } from "@/reducers/duel/mod";
import { fetchYesNoMetaWithEffecDesc } from "@/reducers/duel/modal/yesNoModalSlice";
import { AppDispatch } from "@/store";

import { messageStore } from "@/valtioStores";

type MsgSelectYesNo = ygopro.StocGameMessage.MsgSelectYesNo;

export default async (selectYesNo: MsgSelectYesNo, dispatch: AppDispatch) => {
  const player = selectYesNo.player;
  const effect_description = selectYesNo.effect_description;

  // dispatch(fetchYesNoMetaWithEffecDesc(effect_description));
  // dispatch(setYesNoModalIsOpen(true));

  messageStore.yesNoModal.msg = await getStrings(effect_description);
  messageStore.yesNoModal.isOpen = true;
};
