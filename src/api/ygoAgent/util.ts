import { useConfig } from "@/config";
import { settingStore } from "@/stores/settingStore";

const { agentServer } = useConfig();

export function agentHeader(): Headers {
  const myHeaders = new Headers();
  myHeaders.append("User-Agent", "Apifox/1.0.0 (https://apifox.com)");

  return myHeaders;
}

export function getAgentServer(): string {
  return settingStore.ai.server ?? agentServer;
}
