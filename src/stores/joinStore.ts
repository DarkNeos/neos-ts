import { proxy } from "valtio";

export interface JoinState {
  value: boolean;
}

export const joinStore = proxy<JoinState>({
  value: false,
});
