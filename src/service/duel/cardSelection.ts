import type { Container } from "@/container";
import {
  canSelectOnField,
  displayFieldSelection,
  type FieldSelectionOptions,
} from "@/stores/fieldSelection";
import { displaySelectActionsModal } from "@/ui/Duel/Message/SelectActionsModal";
import { clearSelectInfo } from "@/ui/Duel/utils";

export async function selectCards(
  container: Container,
  options: FieldSelectionOptions,
) {
  if (container.conn.cancelled || container.conn.isClosed()) return;
  clearSelectInfo();
  if (canSelectOnField(container, options))
    await displayFieldSelection(container, options);
  else await displaySelectActionsModal({ ...options, selecteds: [] });
}
