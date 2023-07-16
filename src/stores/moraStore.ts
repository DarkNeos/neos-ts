import { proxy } from "valtio";

import { NeosStore } from "./shared";

export interface MoraState extends NeosStore {
  duelStart: boolean;
  selectHandAble: boolean;
  selectTpAble: boolean;
}

const initialState = {
  duelStart: false,
  selectHandAble: false,
  selectTpAble: false,
};

export const moraStore = proxy<MoraState>({
  ...initialState,
  reset() {
    Object.keys(initialState).forEach((key) => {
      // @ts-ignore
      moraStore[key] = initialState[key];
    });
  },
});
