import { proxy } from "valtio";

import { NeosStore } from "./shared";

export interface JoinState extends NeosStore {
  value: boolean;
}

export const joinStore = proxy<JoinState>({
  value: false,
  reset() {
    joinStore.value = false;
  },
});
