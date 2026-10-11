import { proxy, subscribe } from "valtio";

export type DeckEnvironment = "ocg" | "tcg" | "408";
const STORAGE_KEY = "neos-banlist-selection";
interface BanlistPreference {
  environment: DeckEnvironment;
  selected: Record<DeckEnvironment, string>;
}

function loadPreference(): BanlistPreference {
  const defaults: BanlistPreference = {
    environment: "ocg",
    selected: { ocg: "", tcg: "", "408": "" },
  };
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (saved?.environment === "tcg" || saved?.environment === "408")
      defaults.environment = saved.environment;
    for (const env of ["ocg", "tcg", "408"] as const)
      if (typeof saved?.selected?.[env] === "string")
        defaults.selected[env] = saved.selected[env];
    // 旧版把 OCG 和 TCG 放在一起，将已有的 TCG 选择移到对应环境。
    if (/\bTCG\b/i.test(defaults.selected.ocg)) {
      defaults.selected.tcg ||= defaults.selected.ocg;
      defaults.selected.ocg = "";
      if (defaults.environment === "ocg") defaults.environment = "tcg";
    }
  } catch {
    // 存储不可用或旧数据损坏时使用默认禁限表。
  }
  return defaults;
}

export const banlistStore = proxy({ ...loadPreference(), revision: 0 });
subscribe(banlistStore, () => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        environment: banlistStore.environment,
        selected: banlistStore.selected,
      }),
    );
  } catch {
    // 私密模式等环境仍可在本次会话中切换。
  }
});
