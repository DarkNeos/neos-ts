import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import MsgMove = ygopro.StocGameMessage.MsgMove;
import { AppDispatch } from "../../store";
import { fetchMonsterMeta } from "../../reducers/duel/monstersSlice";
import {
  removeCemetery,
  removeExclusion,
  removeField,
  removeHand,
  removeMagic,
  removeMonster,
} from "../../reducers/duel/mod";
import { fetchMagicMeta } from "../../reducers/duel/magicSlice";
import { fetchCemeteryMeta } from "../../reducers/duel/cemeretySlice";
import { insertHandMeta } from "../../reducers/duel/handsSlice";
import { fetchExclusionMeta } from "../../reducers/duel/exclusionSlice";
import { fetchFieldMeta } from "../../reducers/duel/fieldSlice";

export default (move: MsgMove, dispatch: AppDispatch) => {
  const code = move.code;
  const from = move.from;
  const to = move.to;
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
      if (from.sequence < 5) {
        dispatch(
          removeMagic({ controler: from.controler, sequence: from.sequence })
        );
      } else {
        dispatch(removeField({ controler: from.controler }));
      }

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
      if (to.sequence < 5) {
        dispatch(
          fetchMagicMeta({
            controler: to.controler,
            sequence: to.sequence,
            position: to.position,
            code,
          })
        );
      } else {
        dispatch(
          fetchFieldMeta({
            controler: to.controler,
            sequence: to.sequence,
            code,
          })
        );
      }

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
    default: {
      console.log(`Unhandled zone type ${to.location}`);

      break;
    }
  }
};
