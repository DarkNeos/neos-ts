import { generateDeck } from "./generate";
import { MdproResp } from "./schema";
import { syncDeck } from "./sync";
import { updatePublic } from "./updatePulibc";

export interface UploadReq {
  userId: number;
  token: string;
  deckContributor: string;
  deck: {
    deckName: string;
    deckCase: number;
    deckYdk: string;
  };
}

export async function uploadDeck(
  req: UploadReq,
): Promise<MdproResp<void> | undefined> {
  const generateResp = await generateDeck();
  if (generateResp === undefined) return undefined;

  if (generateResp.code !== 0 || generateResp.data === undefined)
    return { code: generateResp.code, message: generateResp.message };

  const deckId = generateResp.data;

  const syncRes = await syncDeck(
    {
      userId: req.userId,
      deckContributor: req.deckContributor,
      deck: {
        deckId,
        deckName: req.deck.deckName,
        deckType: "", // NEW: Default empty string for deck type
        deckCoverCard1: 0, // NEW: Default to 0
        deckCoverCard2: 0, // NEW: Default to 0
        deckCoverCard3: 0, // NEW: Default to 0
        deckCase: req.deck.deckCase,
        deckProtector: 0, // NEW: Default to 0
        deckYdk: req.deck.deckYdk,
        isDelete: false, // NEW: Not a delete operation
        timestamp: Date.now(), // NEW: Current timestamp
      },
    },
    req.token,
  );

  if (syncRes === undefined) return undefined;

  if (syncRes.code === 0 && syncRes.data === true) {
    // succeed in syncing

    return await updatePublic(
      {
        userId: req.userId,
        deckId,
        isPublic: true,
      },
      req.token,
    );
  } else {
    return { code: syncRes.code, message: syncRes.message };
  }
}
