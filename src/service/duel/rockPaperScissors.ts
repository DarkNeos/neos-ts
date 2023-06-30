import { ygopro } from "@/api";
import { displayOptionModal } from "@/ui/Duel/Message";

export default async (mora: ygopro.StocGameMessage.MsgRockPaperScissors) => {
  const _player = mora.player;

  // TODO: I18n
  await displayOptionModal("请选择猜拳", [
    { msg: "剪刀", response: 1 },
    { msg: "石头", response: 2 },
    { msg: "布", response: 3 },
  ]);
};
