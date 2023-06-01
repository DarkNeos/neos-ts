import { easings } from "@react-spring/web";

import { ygopro } from "@/api";
import { type CardType, isMe, matStore } from "@/stores";

import { matConfig } from "../../utils";
import { SpringApi } from "./types";
import { asyncStart } from "./utils";

/** 发动效果的动画 */
export const focus = async (props: { card: CardType; api: SpringApi }) => {
  const { card, api } = props;
  const current = api.current[0].get();
  if (card.zone === ygopro.CardZone.HAND) {
    await asyncStart(api)({
      y: current.y + (matStore.isMe(card.controller) ? -1 : 1) * 200, // TODO: 放到config之中
      rz: 0,
    });
    await asyncStart(api)({ y: current.y, rz: current.rz });
  } else {
    await asyncStart(api)({ z: 200 });
    await asyncStart(api)({ z: current.z });
  }
};
