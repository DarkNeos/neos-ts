import {
  clearIdleInteractivities,
  clearPlaceInteractivities,
  DuelReducer,
} from "./generic";
import { judgeSelf } from "./util";

export const clearAllIdleInteractivitiesImpl: DuelReducer<number> = (
  state,
  action
) => {
  const player = action.payload;

  const states = judgeSelf(player, state)
    ? [
        state.meHands,
        state.meMonsters,
        state.meMagics,
        state.meCemetery,
        state.meExclusion,
      ]
    : [
        state.opHands,
        state.opMonsters,
        state.opMagics,
        state.opCemetery,
        state.opExclusion,
      ];

  states.forEach((item) => clearIdleInteractivities(item));
};

export const clearAllPlaceInteractivitiesImpl: DuelReducer<number> = (
  state,
  action
) => {
  const player = action.payload;

  const states = judgeSelf(player, state)
    ? [
        state.meHands,
        state.meMonsters,
        state.meMagics,
        state.meCemetery,
        state.meExclusion,
      ]
    : [
        state.opHands,
        state.opMonsters,
        state.opMagics,
        state.opCemetery,
        state.opExclusion,
      ];

  states.forEach((item) => clearPlaceInteractivities(item));
};
