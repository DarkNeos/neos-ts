import type { MoveFunc } from "./types";
import { asyncStart } from "./utils";

export const moveToToken: MoveFunc = async (props) => {
  const { api } = props;
  await asyncStart(api)({
    height: 0,
    opacity: 0,
  });
  api.set({ opacity: 1 });
};
