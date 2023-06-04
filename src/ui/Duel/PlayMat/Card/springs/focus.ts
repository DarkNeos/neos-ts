import { ygopro } from "@/api";
import { type CardType, matStore } from "@/stores";

import { SpringApi } from "./types";
import { asyncStart } from "./utils";

/** 发动效果的动画 */
export const focus = async (props: { card: CardType; api: SpringApi }) => {
  const { card, api } = props;
  const current = api.current[0].get();
  if (card.location.zone === ygopro.CardZone.HAND) {
    await asyncStart(api)({
      y: current.y + (matStore.isMe(card.location.controller) ? -1 : 1) * 200, // TODO: 放到config之中
      rz: 0,
    });
    await asyncStart(api)({ y: current.y, rz: current.rz });
  } else {
    await asyncStart(api)({ z: 200 });
    await asyncStart(api)({ z: current.z });
  }
};
