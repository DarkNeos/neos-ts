import { ygopro } from "@/api";
import { fetchEsHintMeta } from "@/reducers/duel/hintSlice";
import { setMagicPosition, setMonsterPosition } from "@/reducers/duel/mod";
import { AppDispatch } from "@/store";
import MsgPosChange = ygopro.StocGameMessage.MsgPosChange;
import {
  fetchEsHintMeta as FIXME_fetchEsHintMeta,
  matStore,
} from "@/valtioStores";
export default (posChange: MsgPosChange, dispatch: AppDispatch) => {
  const { location, controler, sequence } = posChange.card_info;

  switch (location) {
    case ygopro.CardZone.MZONE: {
      // dispatch(
      //   setMonsterPosition({
      //     controler: controler,
      //     sequence,
      //     position: posChange.cur_position,
      //   })
      // );
      matStore.monsters.of(controler)[sequence].location.position =
        posChange.cur_position;

      break;
    }
    case ygopro.CardZone.SZONE: {
      // dispatch(
      //   setMagicPosition({
      //     controler: controler,
      //     sequence,
      //     position: posChange.cur_position,
      //   })
      // );
      matStore.magics.of(controler)[sequence].location.position =
        posChange.cur_position;

      break;
    }
    default: {
      console.log(`Unhandled zone ${location}`);
    }
  }

  // dispatch(fetchEsHintMeta({ originMsg: 1600 }));
  FIXME_fetchEsHintMeta({
    originMsg: 1600,
  });
};
