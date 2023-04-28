import { proxy } from "valtio";

export interface MoraState {
  duelStart: boolean;
  selectHandAble: boolean;
  selectTpAble: boolean;
}

export const moraStore = proxy<MoraState>({
  duelStart: false,
  selectHandAble: false,
  selectTpAble: false,
});
