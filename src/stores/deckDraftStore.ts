import { subscribe } from "valtio";
import YGOProDeck from "ygopro-deck-encode";

import { mgetDeck } from "@/api/mdproDeck";
import { editDeckStore } from "@/ui/BuildDeck/store";
import {
  type EditingDeck,
  editingDeckToIDeck,
  iDeckToEditingDeck,
} from "@/ui/BuildDeck/utils";

import { DeckDraft } from "./deckDraft";
import { cloudDeckId, deckLibraryStore, localDeckId } from "./deckLibraryStore";
import { deckStore } from "./deckStore";
import { initStore } from "./initStore";
import { personalCloudDeckStore } from "./personalCloudDeckStore";

export const deckDraftStore: DeckDraft<EditingDeck> = new DeckDraft({
  editor: {
    read: () => editingDeckToIDeck(editDeckStore),
    prepare: iDeckToEditingDeck,
    apply: (deck) => editDeckStore.set(deck),
    rename: (name) => {
      editDeckStore.deckName = name;
    },
    get edited() {
      return editDeckStore.edited;
    },
    set edited(value) {
      editDeckStore.edited = value;
    },
  },
  current: () => {
    const entry = deckLibraryStore.selectedEntry;
    const prefix = `cloud:${deckLibraryStore.accountId}:`;
    return {
      accountId: deckLibraryStore.accountId,
      entry: entry?.deck ? { id: entry.id, deck: entry.deck } : undefined,
      deleted:
        (deckDraftStore.state.entryId.startsWith(prefix) &&
          personalCloudDeckStore.isDeleted(
            deckDraftStore.state.entryId.slice(prefix.length),
          )) ||
        (!deckDraftStore.state.saving &&
          deckDraftStore.state.entryId.startsWith("local:") &&
          !deckStore.get(deckDraftStore.state.entryId.slice(6))),
    };
  },
  select: (id) => deckLibraryStore.select(id),
  preview: async (id) => {
    const record = deckLibraryStore.cloudDecks.find(
      (deck) => deck.deckId === id,
    );
    if (record) {
      const entryId = cloudDeckId(deckLibraryStore.accountId!, id);
      const deck = await deckLibraryStore.select(entryId);
      if (!deck) throw new Error("卡组已变化，请重新选择");
      return { id: entryId, deck };
    }
    const response = await mgetDeck(id);
    if (response.code !== 0 || response.data?.deckYdk === undefined)
      throw new Error(response.message?.trim() || "加载卡组失败，请重试");
    const cards = YGOProDeck.fromYdkString(
      response.data.deckYdk.replace(/\\r\\n|\\r|\\n/g, "\n"),
    );
    if (!cards.main.length && !cards.extra.length && !cards.side.length)
      throw new Error("云端未返回卡组内容，请重试");
    return {
      id: "preview",
      deck: {
        deckName: response.data.deckName,
        main: [...cards.main],
        extra: [...cards.extra],
        side: [...cards.side],
      },
    };
  },
  save: async (source, deck) => {
    if (source.id.startsWith("cloud:")) {
      await deckLibraryStore.saveCloud(source.id, deck);
      return { id: source.id, deck };
    }
    if (source.id === "preview") return saveCopy(deck);
    const accountId = deckLibraryStore.accountId;
    if (!(await deckStore.update(source.deck.deckName, deck)))
      throw new Error("已有同名本地卡组，请换一个名称");
    const id = localDeckId(deck.deckName);
    if (accountId !== deckLibraryStore.accountId) return { id, deck };
    deckLibraryStore.renameLocal(source.deck.deckName, deck.deckName);
    await deckLibraryStore.select(id);
    return { id, deck };
  },
  copy: saveCopy,
});

async function saveCopy(
  deck: Parameters<typeof deckLibraryStore.saveLocalCopy>[0],
) {
  const accountId = deckLibraryStore.accountId;
  const copy = await deckLibraryStore.saveLocalCopy(deck);
  const id = localDeckId(copy.deckName);
  if (accountId === deckLibraryStore.accountId)
    await deckLibraryStore.select(id);
  return { id, deck: copy };
}

const sync = () => {
  if (initStore.sqlite.progress === 1)
    void deckDraftStore.sync().catch(() => undefined);
};
subscribe(deckLibraryStore, sync);
subscribe(initStore.sqlite, sync);
