import { ygopro } from "@/api";
import { displayOptionModal } from "@/ui/Duel/Message";

export default async (mora: ygopro.StocGameMessage.MsgRockPaperScissors) => {
  const _player = mora.player;

  // TODO: I18n
  await displayOptionModal(
    "请选择猜拳",
    [
      { info: "剪刀", response: 1 },
      { info: "石头", response: 2 },
      { info: "布", response: 3 },
    ],
    1,
  );
};
