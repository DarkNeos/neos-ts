import { useEnv } from "../hook";

const { DEV, VITE_IS_AI_MODE, VITE_IS_AI_FIRST } = useEnv();

interface AutomationConfig {
  isAiMode: boolean;
  isAiFirst: boolean;
}

const defaultConfig: AutomationConfig = {
  isAiMode: false,
  isAiFirst: false,
};

const aiModeConfig: AutomationConfig = {
  isAiMode: true,
  isAiFirst: VITE_IS_AI_FIRST,
};

const genAutomationConfig = () => {
  if (DEV) {
    if (VITE_IS_AI_MODE) {
      return aiModeConfig;
    }
    // 待拓展
  }

  return defaultConfig;
};

export const automationConfig: AutomationConfig = genAutomationConfig();
