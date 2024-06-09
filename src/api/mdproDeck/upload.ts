import { useConfig } from "@/config";

import { MdproDeck } from "./schema";
import { mdproHeaders } from "./util";

const { mdproServer } = useConfig();
const API_PATH = "api/mdpro3/deck/upload";

interface UploadResp {
  code: number;
  message: string;
  data: MdproDeck;
}

export async function uploadDeck(
  req: MdproDeck,
): Promise<UploadResp | undefined> {
  const myHeaders = mdproHeaders();
  myHeaders.append("Content-Type", "application/json");

  const resp = await fetch(`${mdproServer}/${API_PATH}`, {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify(req),
    redirect: "follow",
  });

  if (!resp.ok) {
    console.error(
      `[Upload of Mdpro Decks] HTTPS error! status: ${resp.status}`,
    );
    return undefined;
  } else {
    return await resp.json();
  }
}
