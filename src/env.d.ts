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

import { EventEmitter } from "eventemitter3";

/* eslint no-var: 0 */
declare global {
  var eventBus: EventEmitter;
  var myExtraDeckCodes: number[];
  enum Report {
    Move = "move",
  }
  interface Console {
    color: (
      color: string,
      backgroundColor?: string
    ) => (...args: any[]) => void;
  }
}
