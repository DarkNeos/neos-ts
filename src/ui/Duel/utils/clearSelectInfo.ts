import { duelSelection } from "@/stores/duelSelection";

export function clearSelectInfo() {
  duelSelection.reset();
}
