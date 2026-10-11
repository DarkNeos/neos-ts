import type { ygopro } from "@/api";
import type { Container } from "@/container";

import { openActiveActions } from "./activeActions";

export default async (
  container: Container,
  message: ygopro.StocGameMessage.MsgSelectBattleCmd,
) => {
  openActiveActions(container, { source: "battle", message });
};
