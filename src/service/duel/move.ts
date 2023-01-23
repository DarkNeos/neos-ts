import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import MsgMove = ygopro.StocGameMessage.MsgMove;
import { AppDispatch } from "../../store";
import { fetchMonsterMeta } from "../../reducers/duel/monstersSlice";
import {
  removeCemetery,
  removeExclusion,
  removeExtraDeck,
  removeHand,
  removeMagic,
  removeMonster,
} from "../../reducers/duel/mod";
import { fetchMagicMeta } from "../../reducers/duel/magicSlice";
import { fetchCemeteryMeta } from "../../reducers/duel/cemeretySlice";
import { insertHandMeta } from "../../reducers/duel/handsSlice";
import { fetchExclusionMeta } from "../../reducers/duel/exclusionSlice";
import { fetchExtraDeckMeta } from "../../reducers/duel/extraDeckSlice";

export default (move: MsgMove, dispatch: AppDispatch) => {
  const code = move.code;
  const from = move.from;
  const to = move.to;
  console.log(to);
  // TODO: reason

  switch (from.location) {
    case ygopro.CardZone.HAND: {
      dispatch(removeHand([from.controler, from.sequence]));

      break;
    }
    case ygopro.CardZone.MZONE: {
      dispatch(
        removeMonster({ controler: from.controler, sequence: from.sequence })
      );

      break;
    }
    case ygopro.CardZone.SZONE: {
      dispatch(
        removeMagic({ controler: from.controler, sequence: from.sequence })
      );

      break;
    }
    case ygopro.CardZone.GRAVE: {
      dispatch(
        removeCemetery({ controler: from.controler, sequence: from.sequence })
      );

      break;
    }
    case ygopro.CardZone.REMOVED: {
      dispatch(
        removeExclusion({ controler: from.controler, sequence: from.sequence })
      );

      break;
    }
    case ygopro.CardZone.EXTRA: {
      dispatch(
        removeExtraDeck({ controler: from.controler, sequence: from.sequence })
      );

      break;
    }
    default: {
      console.log(`Unhandled zone type ${from.location}`);
      break;
    }
  }

  switch (to.location) {
    case ygopro.CardZone.MZONE: {
      dispatch(
        fetchMonsterMeta({
          controler: to.controler,
          sequence: to.sequence,
          position: to.position,
          code,
        })
      );

      break;
    }
    case ygopro.CardZone.SZONE: {
      dispatch(
        fetchMagicMeta({
          controler: to.controler,
          sequence: to.sequence,
          position: to.position,
          code,
        })
      );

      break;
    }
    case ygopro.CardZone.GRAVE: {
      dispatch(
        fetchCemeteryMeta({
          controler: to.controler,
          sequence: to.sequence,
          code,
        })
      );

      break;
    }
    case ygopro.CardZone.HAND: {
      dispatch(
        insertHandMeta({ controler: to.controler, sequence: to.sequence, code })
      );

      break;
    }
    case ygopro.CardZone.REMOVED: {
      dispatch(
        fetchExclusionMeta({
          controler: to.controler,
          sequence: to.sequence,
          code,
        })
      );

      break;
    }
    case ygopro.CardZone.EXTRA: {
      dispatch(
        fetchExtraDeckMeta({
          controler: to.controler,
          sequence: to.sequence,
          code,
        })
      );

      break;
    }
    default: {
      console.log(`Unhandled zone type ${to.location}`);

      break;
    }
  }
};
