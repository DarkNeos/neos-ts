import { useEnv } from "@/hook";

const { DEV, VITE_IS_AI_MODE, VITE_AI_MODE_DEFAULT_DECK } = useEnv();

interface DefaultsConfig {
  defaultPlayer: string;
  defaultDeck: string;
  defaultPassword: string;
  defaultMora: string;
}

const defaultConfig: DefaultsConfig = {
  defaultPlayer: "",
  defaultDeck: "",
  defaultPassword: "",
  defaultMora: "scissors",
};

const aiModeConfig: DefaultsConfig = {
  ...defaultConfig,
  defaultDeck: VITE_AI_MODE_DEFAULT_DECK || "Hero",
  defaultPlayer: `AiKiller${Math.random().toString(36).slice(2)}}`,
  defaultPassword: "AI",
};

const genDefaultsConfig = () => {
  if (DEV) {
    if (VITE_IS_AI_MODE) {
      return aiModeConfig;
    }
    // 待拓展
  }

  return defaultConfig;
};

export const defaultsConfig: DefaultsConfig = genDefaultsConfig();
