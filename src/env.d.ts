/// <reference types="react-scripts" />
/// <reference types="vite/client" />
/// <reference types="eventemitter3" />

interface ImportMetaEnv {
  readonly VITE_IS_AI_MODE: boolean;
  readonly VITE_IS_AI_FIRST: boolean;
  readonly VITE_AI_MODE_DEFAULT_DECK: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/* eslint @typescript-eslint/no-unused-vars: 0 */
import { EventEmitter } from "eventemitter3";

/* eslint no-var: 0 */
declare global {
  var myExtraDeckCodes: number[];
  interface Console {
    color: (
      color: string,
      backgroundColor?: string
    ) => (...args: Parameters<console.log>) => void;
  }
}
