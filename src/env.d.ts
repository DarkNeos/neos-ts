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

// 定义一个全局的myExtraDeckCodes变量
declare var myExtraDeckCodes: number[];

import { EventEmitter } from "eventemitter3";

declare global {
  var eventBus: EventEmitter;
}
