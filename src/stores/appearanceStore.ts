import { proxy, subscribe } from "valtio";

import { duelAssetUrl } from "@/api/duelAssets";
import sleeves from "@/config/sleeves.json";

export type SleeveSlot = "meMain" | "meExtra" | "opMain" | "opExtra";
const key = "__neos_appearance__";
const defaults: Record<SleeveSlot, string> = {
  meMain: "default",
  meExtra: "default",
  opMain: "default",
  opExtra: "default",
};
export interface Sleeve {
  id: string;
  name: string;
  file: string;
}
export const sleeveCatalog: Sleeve[] = [
  { id: "default", name: "经典卡背", file: "card_back.webp" },
  ...(sleeves as Sleeve[]),
];
const byId = new Map(sleeveCatalog.map((sleeve) => [sleeve.id, sleeve]));
let saved = { ...defaults };
try {
  const stored = JSON.parse(localStorage.getItem(key) ?? "{}");
  for (const slot of Object.keys(defaults) as SleeveSlot[]) {
    if (typeof stored?.[slot] === "string" && byId.has(stored[slot]))
      saved[slot] = stored[slot];
  }
} catch {
  /* 无效的旧配置恢复为默认卡背。 */
}
export const appearanceStore = proxy(saved);
subscribe(appearanceStore, () =>
  localStorage.setItem(key, JSON.stringify(appearanceStore)),
);
export function sleeveUrl(id: string) {
  const sleeve = byId.get(id) ?? sleeveCatalog[0];
  return duelAssetUrl(
    sleeve.id === "default" ? sleeve.file : `sleeves/${sleeve.file}`,
  );
}
