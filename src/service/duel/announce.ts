import { ygopro } from "@/api";
type MsgAnnounce = ygopro.StocGameMessage.MsgAnnounce;

export default (announce: MsgAnnounce) => {
  console.log(announce);
};
