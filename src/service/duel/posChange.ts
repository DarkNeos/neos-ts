import { ygopro } from "@/api/ocgcore/idl/ocgcore";
import { fetchEsHintMeta } from "@/reducers/duel/hintSlice";
import { setMagicPosition, setMonsterPosition } from "@/reducers/duel/mod";
import { AppDispatch } from "@/store";
import MsgPosChange = ygopro.StocGameMessage.MsgPosChange;

export default (posChange: MsgPosChange, dispatch: AppDispatch) => {
  const cardInfo = posChange.card_info;

  switch (cardInfo.location) {
    case ygopro.CardZone.MZONE: {
      dispatch(
        setMonsterPosition({
          controler: cardInfo.controler,
          sequence: cardInfo.sequence,
          position: posChange.cur_position,
        })
      );

      break;
    }
    case ygopro.CardZone.SZONE: {
      dispatch(
        setMagicPosition({
          controler: cardInfo.controler,
          sequence: cardInfo.sequence,
          position: posChange.cur_position,
        })
      );

      break;
    }
    default: {
      console.log(`Unhandled zone ${cardInfo.location}`);
    }
  }

  dispatch(fetchEsHintMeta({ originMsg: 1600 }));
};
