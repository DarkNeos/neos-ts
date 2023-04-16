export * from "./chatStore";
export * from "./joinStore";
export * from "./moraStore";
export * from "./playerStore";
export * from "./duelStore";

import { createContext, type ReactNode, useRef } from "react";
import { proxy } from "valtio";
import { devtools } from "valtio/utils";

import { chatStore } from "./chatStore";
import { joinStore } from "./joinStore";
import { moraStore } from "./moraStore";
import { playerStore } from "./playerStore";
import { duelStore } from "./duelStore";

export const valtioStore = proxy({
  playerStore,
  chatStore,
  joinStore,
  moraStore,
  duelStore,
});

devtools(valtioStore, { name: "valtio store", enabled: true });

/**
 * 在组件之中使用valtio store
 */
export const valtioContext = createContext<typeof valtioStore>({} as any);

/**
 * 包裹根节点，使得所有子组件都可以使用valtio store
 */
export const ValtioProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const state = useRef(valtioStore).current;
  return (
    <valtioContext.Provider value={state}>{children}</valtioContext.Provider>
  );
};
