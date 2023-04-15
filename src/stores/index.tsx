export * from "./chatStore";
export * from "./joinStore";
export * from "./moraStore";
export * from "./playerStore";

import { createContext, type ReactNode, useRef } from "react";
import { proxy } from "valtio";
import { devtools } from "valtio/utils";

import { chatStore } from "./chatStore";
import { joinStore } from "./joinStore";
import { moraStore } from "./moraStore";
import { playerStore } from "./playerStore";

export const valtioStore = proxy({
  playerStore,
  chatStore,
  joinStore,
  moraStore,
});

devtools(valtioStore, { name: "valtio store", enabled: true });

/**
 * 在组件之中使用valtio store
 */
export const ValtioContext = createContext<typeof valtioStore>({} as any);

/**
 * 包裹根节点，使得所有子组件都可以使用valtio store
 */
export const ValtioProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const state = useRef(valtioStore).current;
  return (
    <ValtioContext.Provider value={state}>{children}</ValtioContext.Provider>
  );
};
