import { ygopro } from "@/api";
import { messageStore } from "@/stores";

type MsgSelectPosition = ygopro.StocGameMessage.MsgSelectPosition;

export default (selectPosition: MsgSelectPosition) => {
  const _player = selectPosition.player;
  const positions = selectPosition.positions;

  messageStore.positionModal.positions = positions.map(
    (position) => position.position
  );
  messageStore.positionModal.isOpen = true;
};
