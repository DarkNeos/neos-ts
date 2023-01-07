import { CardMeta } from "../../api/cards";
import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import { fetchYesNoMeta } from "../../reducers/duel/modalSlice";
import { AppDispatch } from "../../store";
import { CardZoneToChinese } from "./util";
import MsgSelectEffectYn = ygopro.StocGameMessage.MsgSelectEffectYn;

export default (selectEffectYn: MsgSelectEffectYn, dispatch: AppDispatch) => {
  const player = selectEffectYn.player;
  const code = selectEffectYn.code;
  const location = selectEffectYn.location;
  const effect_description = selectEffectYn.effect_description;

  const textGenerator =
    effect_description == 0 || effect_description == 221
      ? (
          desc: string,
          cardMeta: CardMeta,
          cardLocation: ygopro.CardLocation
        ) => {
          const desc1 = desc.replace(
            `[%ls]`,
            CardZoneToChinese(cardLocation.location)
          );
          const desc2 = desc1.replace(`[%ls]`, cardMeta.text.name || "[?]");
          return desc2;
        }
      : (desc: string, cardMeta: CardMeta, _: ygopro.CardLocation) => {
          const desc1 = desc.replace(`[%ls]`, cardMeta.text.name || "[?]");
          return desc1;
        };
  dispatch(
    fetchYesNoMeta({
      code,
      location,
      descCode: effect_description,
      textGenerator,
    })
  );
};
