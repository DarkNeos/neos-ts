import { cardStore, matStore } from "@/stores";

export function clearSelectInfo() {
  const selectUnselectInfo = matStore.selectUnselectInfo;
  for (const location of selectUnselectInfo.selectableList) {
    const card = cardStore.find(location);
    if (card) {
      card.selectInfo.selectable = false;
      card.selectInfo.response = undefined;
    }
  }
  for (const location of selectUnselectInfo.selectedList) {
    const card = cardStore.find(location);
    if (card) {
      card.selectInfo.selected = false;
    }
  }

  matStore.selectUnselectInfo.finishable = false;
  matStore.selectUnselectInfo.cancelable = false;
  matStore.selectUnselectInfo.selectableList = [];
  matStore.selectUnselectInfo.selectedList = [];
}
