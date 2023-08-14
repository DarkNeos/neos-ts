import { ygopro } from "@/api";
import { displayPositionModal } from "@/ui/Duel/Message";

type MsgSelectPosition = ygopro.StocGameMessage.MsgSelectPosition;

export default async (selectPosition: MsgSelectPosition) => {
  const _player = selectPosition.player;
  const positions = selectPosition.positions.map(
    (position) => position.position,
  );
  await displayPositionModal(positions);
};
