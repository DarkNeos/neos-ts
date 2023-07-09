import { asyncStart, type MoveFunc } from "./utils";

export const moveToToken: MoveFunc = async (props) => {
  const { api } = props;
  await asyncStart(api)({
    height: 0,
  });
};
