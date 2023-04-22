import { ygopro } from "@/api";
import {
  setPositionModalIsOpen,
  setPositionModalPositions,
} from "@/reducers/duel/mod";
import { AppDispatch } from "@/store";
import { messageStore } from "@/valtioStores";

type MsgSelectPosition = ygopro.StocGameMessage.MsgSelectPosition;

export default (selectPosition: MsgSelectPosition, dispatch: AppDispatch) => {
  const player = selectPosition.player;
  const positions = selectPosition.positions;

  dispatch(
    setPositionModalPositions(positions.map((position) => position.position))
  );

  dispatch(setPositionModalIsOpen(true));

  messageStore.positionModal.positions = positions.map(
    (position) => position.position
  );
  messageStore.positionModal.isOpen = true;
};
