import {
  DESCRIPTION_LIMIT,
  fetchCard,
  fetchStrings,
  getStrings,
  Region,
  type ygopro,
} from "@/api";
import { Container } from "@/container";
import { displayOptionModal } from "@/ui/Duel/Message";

export default async (
  _container: Container,
  selectOption: ygopro.StocGameMessage.MsgSelectOption,
) => {
  const options = selectOption.options;

  await displayOptionModal(
    fetchStrings(Region.System, 556),
    options.length
      ? options.map(({ code, response }) => ({
          info: getStrings(code),
          response,
          // 描述编号指向效果来源；被赋予的效果可能来自另一张卡。
          card: code >= DESCRIPTION_LIMIT ? fetchCard(code >> 4) : undefined,
        }))
      : [{ info: fetchStrings(Region.System, 556), response: 0 }],
    1,
  );
};
