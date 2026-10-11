import { proxy, subscribe } from "valtio";

import { deckStore, type IDeck } from "./deckStore";
import type { DeckAccount } from "./onlineDecks";
import type { CloudDeckRecord } from "./personalCloudDecks";
import { personalCloudDeckStore } from "./personalCloudDeckStore";

export interface DeckLibraryEntry {
  id: string;
  source: "local" | "cloud";
  deckName: string;
  deck?: IDeck;
}

interface Preferences {
  selectedId: string;
  pinned: string[];
  collapsed: string[];
  query: string;
}

let account: DeckAccount | undefined;
let initialized = false;
let session = 0;
let selectionRevision = 0;

export const localDeckId = (name: string) => `local:${name}`;
export const cloudDeckId = (userId: number, deckId: string) =>
  `cloud:${userId}:${deckId}`;

const preferenceKey = () => `neos.deck-library.${account?.id ?? "guest"}`;
function readPreferences(): Preferences {
  try {
    const saved = JSON.parse(localStorage.getItem(preferenceKey()) ?? "{}");
    return {
      selectedId: typeof saved.selectedId === "string" ? saved.selectedId : "",
      pinned: Array.isArray(saved.pinned)
        ? saved.pinned.filter((id: unknown) => typeof id === "string")
        : [],
      collapsed: Array.isArray(saved.collapsed)
        ? saved.collapsed.filter((id: unknown) => typeof id === "string")
        : [],
      query: typeof saved.query === "string" ? saved.query : "",
    };
  } catch {
    return { selectedId: "", pinned: [], collapsed: [], query: "" };
  }
}

function persistPreferences() {
  const { selectedId, pinned, collapsed, query } = deckLibraryStore;
  try {
    localStorage.setItem(
      preferenceKey(),
      JSON.stringify({ selectedId, pinned, collapsed, query }),
    );
  } catch {
    // 浏览器禁用存储时，本次会话仍可选择和使用卡组。
  }
}

/** 卡组库管理本地卡组与选择偏好，个人云卡组状态由共享记录提供。 */
export const deckLibraryStore = proxy({
  local: deckStore,
  cloud: personalCloudDeckStore.state,
  get accountId(): number | undefined {
    return deckLibraryStore.cloud.accountId;
  },
  get cloudDecks(): CloudDeckRecord[] {
    return deckLibraryStore.cloud.decks;
  },
  get loading(): boolean {
    return deckLibraryStore.cloud.loading;
  },
  get restoring(): boolean {
    return deckLibraryStore.cloud.restoring;
  },
  get error(): string {
    return deckLibraryStore.cloud.error;
  },
  selectedId: "",
  selectingId: "",
  pinned: [] as string[],
  collapsed: [] as string[],
  query: "",

  get entries(): DeckLibraryEntry[] {
    const local: DeckLibraryEntry[] = deckLibraryStore.local.decks.map(
      (deck) => ({
        id: localDeckId(deck.deckName),
        source: "local",
        deckName: deck.deckName,
        deck,
      }),
    );
    const cloud: DeckLibraryEntry[] = deckLibraryStore.cloudDecks.map(
      (deck) => ({
        id: cloudDeckId(deckLibraryStore.accountId!, deck.deckId),
        source: "cloud",
        deckName: deck.deckName,
        deck: deck.content,
      }),
    );
    return [...local, ...cloud].sort(
      (a, b) =>
        Number(deckLibraryStore.pinned.includes(b.id)) -
        Number(deckLibraryStore.pinned.includes(a.id)),
    );
  },

  get selectedEntry(): DeckLibraryEntry | undefined {
    const { entries, selectedId } = deckLibraryStore;
    if (selectedId) {
      const found = entries.find((entry) => entry.id === selectedId);
      if (found || selectedId.startsWith("cloud:")) return found;
    }
    const selectedName = deckLibraryStore.local.selectedDeck?.deckName;
    return entries.find(
      (entry) => entry.id === localDeckId(selectedName ?? ""),
    );
  },

  get selectedDeck(): IDeck | undefined {
    return deckLibraryStore.selectedEntry?.deck;
  },

  async setAccount(next?: DeckAccount) {
    if (
      initialized &&
      next?.id === account?.id &&
      next?.token === account?.token
    )
      return;
    initialized = true;
    ++session;
    ++selectionRevision;
    account = next ? { ...next } : undefined;
    deckLibraryStore.selectingId = "";
    const loading = personalCloudDeckStore.setAccount(next);
    Object.assign(deckLibraryStore, readPreferences());
    if (deckLibraryStore.selectedId.startsWith("local:"))
      deckStore.selectedDeckName = deckLibraryStore.selectedId.slice(6);
    await loading.catch(() => undefined);
    await refreshSelected();
  },

  async refresh() {
    await personalCloudDeckStore.refresh().catch(() => undefined);
    await refreshSelected();
  },

  async resolve(id: string): Promise<IDeck> {
    const entry = deckLibraryStore.entries.find((item) => item.id === id);
    if (!entry) throw new Error("卡组已不可用，请刷新列表");
    if (entry.source === "local" && entry.deck) return entry.deck;
    const record = deckLibraryStore.cloudDecks.find(
      (deck) => cloudDeckId(deckLibraryStore.accountId!, deck.deckId) === id,
    );
    if (!record) throw new Error("卡组已不可用，请刷新列表");
    return personalCloudDeckStore.resolve(record.deckId);
  },

  async select(id: string): Promise<IDeck | undefined> {
    const revision = ++selectionRevision;
    const currentSession = session;
    deckLibraryStore.selectingId = id;
    try {
      const deck = await deckLibraryStore.resolve(id);
      if (revision !== selectionRevision || currentSession !== session) return;
      deckLibraryStore.selectedId = id;
      if (id.startsWith("local:")) deckStore.selectedDeckName = deck.deckName;
      persistPreferences();
      return deck;
    } finally {
      if (revision === selectionRevision) deckLibraryStore.selectingId = "";
    }
  },

  async saveCloud(id: string, deck: IDeck) {
    const record = deckLibraryStore.cloudDecks.find(
      (item) => cloudDeckId(deckLibraryStore.accountId!, item.deckId) === id,
    );
    if (!record) throw new Error("云卡组已不可用，请刷新列表");
    await personalCloudDeckStore.save(record.deckId, deck);
  },

  async deleteCloud(id: string) {
    const record = deckLibraryStore.cloudDecks.find(
      (item) => cloudDeckId(deckLibraryStore.accountId!, item.deckId) === id,
    );
    if (!record) throw new Error("账号或卡组已变化，请重新打开删除确认");
    await personalCloudDeckStore.delete(
      record.deckId,
      deckLibraryStore.accountId!,
    );
  },

  async saveLocalCopy(deck: IDeck) {
    const base = deck.deckName.trim() || "未命名卡组";
    let name = base;
    for (let suffix = 2; deckStore.get(name); suffix++)
      name = `${base} (${suffix})`;
    const copy = { ...deck, deckName: name };
    await deckStore.add(copy);
    return copy;
  },

  renameLocal(previousName: string, nextName: string) {
    const before = localDeckId(previousName);
    const after = localDeckId(nextName);
    deckLibraryStore.pinned = deckLibraryStore.pinned.map((id) =>
      id === before ? after : id,
    );
    if (deckLibraryStore.selectedId === before)
      deckLibraryStore.selectedId = after;
    persistPreferences();
  },

  togglePin(id: string) {
    deckLibraryStore.pinned = deckLibraryStore.pinned.includes(id)
      ? deckLibraryStore.pinned.filter((item) => item !== id)
      : [...deckLibraryStore.pinned, id];
    persistPreferences();
  },
  toggleGroup(id: string) {
    deckLibraryStore.collapsed = deckLibraryStore.collapsed.includes(id)
      ? deckLibraryStore.collapsed.filter((item) => item !== id)
      : [...deckLibraryStore.collapsed, id];
    persistPreferences();
  },
  search(query: string) {
    deckLibraryStore.query = query;
    persistPreferences();
  },
});

async function refreshSelected() {
  const selected = deckLibraryStore.selectedEntry;
  if (selected?.source === "cloud")
    await deckLibraryStore.resolve(selected.id).catch(() => undefined);
}

// 删除和外部刷新都通过共享记录更新选择与偏好，页面无需逐个清理。
subscribe(personalCloudDeckStore.state, () => {
  let changed = false;
  const isDeleted = (id: string) => {
    const prefix = `cloud:${deckLibraryStore.accountId}:`;
    return (
      id.startsWith(prefix) &&
      personalCloudDeckStore.isDeleted(id.slice(prefix.length))
    );
  };
  const pinned = deckLibraryStore.pinned.filter((id) => !isDeleted(id));
  if (pinned.length !== deckLibraryStore.pinned.length) {
    deckLibraryStore.pinned = pinned;
    changed = true;
  }
  if (isDeleted(deckLibraryStore.selectingId)) {
    ++selectionRevision;
    deckLibraryStore.selectingId = "";
  }
  if (
    deckLibraryStore.selectedId.startsWith("cloud:") &&
    !deckLibraryStore.selectedEntry &&
    !deckLibraryStore.loading &&
    !deckLibraryStore.restoring &&
    (!deckLibraryStore.error || isDeleted(deckLibraryStore.selectedId))
  ) {
    deckLibraryStore.selectedId = "";
    changed = true;
  }
  if (changed) persistPreferences();
});
