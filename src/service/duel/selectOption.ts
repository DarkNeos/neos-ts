import {
  fetchStrings,
  getStrings,
  Region,
  sendSelectOptionResponse,
  type ygopro,
} from "@/api";
import { Container } from "@/container";
import { displayOptionModal } from "@/ui/Duel/Message";

export default async (
  container: Container,
  selectOption: ygopro.StocGameMessage.MsgSelectOption,
) => {
  const conn = container.conn;
  const options = selectOption.options;
  if (options.length === 0) {
    sendSelectOptionResponse(conn, 0);
    return;
  }

  if (options.length === 1) {
    sendSelectOptionResponse(conn, options[0].response);
    return;
  }

  await displayOptionModal(
    fetchStrings(Region.System, 556),
    options.map(({ code, response }) => ({
      info: getStrings(code),
      response,
    })),
    1,
  );
};
