import { ygopro } from "@/api";

export default async (
  confirmDeskTop: ygopro.StocGameMessage.MsgConfirmDeskTop
) => {
  console.log(confirmDeskTop);
};
