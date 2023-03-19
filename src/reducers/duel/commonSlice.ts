import { Reducer } from "react";
import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import {
  clearIdleInteractivities,
  clearPlaceInteractivities,
  DuelReducer,
  updateCardData,
} from "./generic";
import { judgeSelf } from "./util";
import MsgReloadField = ygopro.StocGameMessage.MsgReloadField;
type MsgUpdateData = ReturnType<
  typeof ygopro.StocGameMessage.MsgUpdateData.prototype.toObject
>;

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
        state.meExtraDeck,
      ]
    : [
        state.opHands,
        state.opMonsters,
        state.opMagics,
        state.opCemetery,
        state.opExclusion,
        state.opExtraDeck,
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

export const updateFieldDataImpl: DuelReducer<MsgUpdateData> = (
  state,
  action
) => {
  const player = action.payload.player;
  const zone = action.payload.zone;
  const actions = action.payload.actions;

  if (player && zone && actions) {
    switch (zone) {
      case ygopro.CardZone.HAND: {
        const hand = judgeSelf(player, state) ? state.meHands : state.opHands;
        updateCardData(hand, actions);

        break;
      }
      case ygopro.CardZone.EXTRA: {
        const extra = judgeSelf(player, state)
          ? state.meExtraDeck
          : state.opExtraDeck;
        updateCardData(extra, actions);

        break;
      }
      case ygopro.CardZone.MZONE: {
        const monster = judgeSelf(player, state)
          ? state.meMonsters
          : state.opMonsters;
        updateCardData(monster, actions);

        break;
      }
      case ygopro.CardZone.SZONE: {
        const magics = judgeSelf(player, state)
          ? state.meMagics
          : state.opMagics;
        updateCardData(magics, actions);

        break;
      }
      case ygopro.CardZone.GRAVE: {
        const cemetery = judgeSelf(player, state)
          ? state.meCemetery
          : state.opCemetery;
        updateCardData(cemetery, actions);

        break;
      }
      case ygopro.CardZone.REMOVED: {
        const exclusion = judgeSelf(player, state)
          ? state.meExclusion
          : state.opExclusion;
        updateCardData(exclusion, actions);

        break;
      }
      default: {
        break;
      }
    }
  }
};

export const reloadFieldImpl: DuelReducer<MsgReloadField> = (state, action) => {
  const _duel_rule = action.payload.duel_rule;
  for (const reload of action.payload.actions) {
    const player = reload.player;

    // MZONE
  }
};
