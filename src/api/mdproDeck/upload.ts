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

export async function uploadDeck(req: UploadReq): Promise<MdproResp<void>> {
  const generateResp = await generateDeck();
  if (
    generateResp.code !== 0 ||
    typeof generateResp.data !== "string" ||
    !generateResp.data.trim()
  )
    return {
      code: generateResp.code || -1,
      message: generateResp.message?.trim() || "云端未返回卡组 ID，请重试",
    };

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

  if (syncRes.code !== 0 || syncRes.data !== "true")
    return {
      code: syncRes.code || -1,
      message: syncRes.message?.trim() || "云端未确认上传，请重试",
    };

  const publicRes = await updatePublic(
    { userId: req.userId, deckId, isPublic: true },
    req.token,
  );
  if (publicRes.code !== 0 || publicRes.message !== "true")
    return {
      code: publicRes.code || -1,
      message:
        publicRes.code !== 0 && publicRes.message?.trim()
          ? `卡组已保存到云端，但公开失败：${publicRes.message}`
          : "卡组已保存到云端，但公开状态未更新，请稍后重试",
    };
  return { code: 0, message: "" };
}
