import { automationConfig } from "./automation";
import { defaultsConfig } from "./defaults";
import { envConfig } from "./env";

export const useConfig = () =>
  ({
    automation: automationConfig,
    defaults: defaultsConfig,
    ...envConfig,
  } satisfies Record<string, unknown>);
