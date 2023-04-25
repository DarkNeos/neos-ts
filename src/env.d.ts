/// <reference types="react-scripts" />
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_IS_AI_MODE: boolean;
  readonly VITE_IS_AI_FIRST: boolean;
  readonly VITE_AI_MODE_DEFAULT_DECK: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// 重新声明useSnapshot，暂时先这么写。原版的会把所有的改成readonly，引发一些棘手的类型报错。
import "valtio/react";
declare module "valtio/react" {
  export declare function useSnapshot<T extends object>(proxyObject: T): T;
  export {};
}
