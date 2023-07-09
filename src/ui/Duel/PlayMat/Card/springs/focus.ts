import { ygopro } from "@/api";
import { type CardType, matStore } from "@/stores";

import { SpringApi } from "./types";
import { asyncStart } from "./utils";

/** 发动效果的动画 */
export const focus = async (props: { card: CardType; api: SpringApi }) => {
  const { card, api } = props;
  if (
    card.location.zone == ygopro.CardZone.HAND ||
    card.location.zone == ygopro.CardZone.DECK
  ) {
    const current = api.current[0].get();
    await asyncStart(api)({
      y: current.y + (matStore.isMe(card.location.controller) ? -1 : 1) * 200, // TODO: 放到config之中
      ry: 0,
      rz: 0,
    });
    await asyncStart(api)({
      y: current.y,
      ry: current.ry,
      rz: current.rz,
      z: current.z,
    });
  } else {
    await asyncStart(api)({
      focusScale: 1.5,
      focusDisplay: "block",
      focusOpacity: 0,
    });
    api.set({ focusScale: 1, focusOpacity: 1, focusDisplay: "none" });
  }
};
