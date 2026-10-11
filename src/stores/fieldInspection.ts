import { proxy } from "valtio";

import { registerDuelDialogReset } from "./duelDialogs";

export const fieldInspection = proxy<{
  hovered: string | null;
  pinned: string | null;
}>({ hovered: null, pinned: null });
registerDuelDialogReset(() => {
  fieldInspection.hovered = null;
  fieldInspection.pinned = null;
});
