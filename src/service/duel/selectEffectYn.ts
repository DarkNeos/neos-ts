import { ygopro } from "@/api";
import { CardMeta, fetchCard } from "@/api/cards";
import { fetchStrings } from "@/api/strings";
import { setYesNoModalIsOpen } from "@/reducers/duel/mod";
import { fetchYesNoMeta } from "@/reducers/duel/modal/mod";
import { AppDispatch } from "@/store";
import { getCardByLocation, messageStore } from "@/valtioStores";

import { CardZoneToChinese } from "./util";

type MsgSelectEffectYn = ygopro.StocGameMessage.MsgSelectEffectYn;

// 这里改成了 async 不知道有没有影响
export default async (
  selectEffectYn: MsgSelectEffectYn,
  dispatch: AppDispatch
) => {
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
  // dispatch(
  //   fetchYesNoMeta({
  //     code,
  //     location,
  //     descCode: effect_description,
  //     textGenerator,
  //   })
  // );
  // TODO: 国际化文案
  dispatch(setYesNoModalIsOpen(true));

  const desc = fetchStrings("!system", effect_description);
  const meta = await fetchCard(code);
  messageStore.yesNoModal.msg = textGenerator(desc, meta, location);
  messageStore.yesNoModal.isOpen = true;
};
