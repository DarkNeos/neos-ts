import type { MoveFunc } from "./types";
import { asyncStart } from "./utils";

export const moveToToken: MoveFunc = async (props) => {
  const { api } = props;
  await asyncStart(api)({
    height: 0,
    opacity: 0,
    config: {
      duration: duelDuration(duelAnimation.tokenDisappear),
      clamp: true,
    },
  });
  api.set({ opacity: 1 });
};
import { duelAnimation, duelDuration } from "@/infra/duelAnimation";
