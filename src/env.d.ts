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

declare global {
  var eventBus: EventEmitter;
  var myExtraDeckCodes: number[];
  export enum Report {
    Move = "move",
  }
}
