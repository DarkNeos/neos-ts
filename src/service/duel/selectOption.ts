import { fetchStrings, getStrings, Region, type ygopro } from "@/api";
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
        }))
      : [{ info: fetchStrings(Region.System, 556), response: 0 }],
    1,
    { autoSelect: true },
  );
};
