import { ygopro } from "@/api";
import MsgShuffleSetCard = ygopro.StocGameMessage.MsgShuffleSetCard;

export default (shuffleSetCard: MsgShuffleSetCard) => {
  console.log(shuffleSetCard);
};
