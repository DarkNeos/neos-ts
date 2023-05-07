import { messageStore } from "../store";

const { selectCardActions } = messageStore;

export const clearSelectActions = () => {
  selectCardActions.isOpen = false;
  selectCardActions.isChain = undefined;
  selectCardActions.min = undefined;
  selectCardActions.max = undefined;
  selectCardActions.cancelAble = false;
  selectCardActions.totalLevels = undefined;
  selectCardActions.selecteds = [];
  selectCardActions.selectables = [];
  selectCardActions.mustSelects = [];
  selectCardActions.finishAble = false;
  selectCardActions.overflow = false;
};
