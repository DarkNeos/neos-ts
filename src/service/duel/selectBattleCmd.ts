import type { ygopro } from "@/api";
import type { Container } from "@/container";

import { openActiveActions } from "./activeActions";

export default async (
  container: Container,
  message: ygopro.StocGameMessage.MsgSelectBattleCmd,
) => {
  container.context.matStore.clearAttack();
  openActiveActions(container, { source: "battle", message });
};
