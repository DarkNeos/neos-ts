import { ygopro } from "@/api/ocgcore/idl/ocgcore";
import {
  setPositionModalIsOpen,
  setPositionModalPositions,
} from "@/reducers/duel/mod";
import { AppDispatch } from "@/store";
import MsgSelectPosition = ygopro.StocGameMessage.MsgSelectPosition;

export default (selectPosition: MsgSelectPosition, dispatch: AppDispatch) => {
  const player = selectPosition.player;
  const positions = selectPosition.positions;

  dispatch(
    setPositionModalPositions(positions.map((position) => position.position))
  );
  dispatch(setPositionModalIsOpen(true));
};
