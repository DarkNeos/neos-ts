import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import MsgMove = ygopro.StocGameMessage.MsgMove;
import { AppDispatch } from "../../store";
import { fetchMonsterMeta } from "../../reducers/duel/monstersSlice";
import { removeHand } from "../../reducers/duel/mod";
import { fetchMagicMeta } from "../../reducers/duel/magicSlice";
import { fetchCemeteryMeta } from "../../reducers/duel/cemeretySlice";

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
    default: {
      console.log(`Unhandled zone type ${to.location}`);

      break;
    }
  }
};
