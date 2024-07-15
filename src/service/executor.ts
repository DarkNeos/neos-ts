import { Container } from "@/container";

import { YgoAgent } from "./duel/agent";
import handleSocketMessage from "./onSocketMessage";

export async function pollSocketLooper(container: Container) {
  await container.conn.execute((event) =>
    handleSocketMessage(container, event),
  );
}

export async function pollSocketLooperWithAgent(container: Container) {
  const agent = new YgoAgent();
  agent.attachContext(container.context);
  await container.conn.execute((event) =>
    handleSocketMessage(container, event, agent),
  );
}
