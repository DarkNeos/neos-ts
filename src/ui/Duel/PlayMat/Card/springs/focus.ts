import { config } from "@react-spring/web";

import { ygopro } from "@/api";
import { type CardType, matStore } from "@/stores";

import { SpringApi } from "./types";
import { asyncStart } from "./utils";

/** 发动效果的动画 */
export const focus = async (props: { card: CardType; api: SpringApi }) => {
  const { card, api } = props;
  await asyncStart(api)({
    focusScale: 1.5,
    focusDisplay: "block",
    focusOpacity: 0,
  });
  api.set({ focusScale: 1, focusOpacity: 1, focusDisplay: "none" });
};
