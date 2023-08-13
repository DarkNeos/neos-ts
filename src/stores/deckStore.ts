import { clear, createStore, del, set, values } from "idb-keyval";
import { proxy } from "valtio";

import { type NeosStore } from "./shared";

const IDB_NAME = "decks";
const deckIdb = createStore(IDB_NAME, IDB_NAME);

export interface IDeck {
  deckName: string;
  main: number[];
  extra: number[];
  side: number[];
}

export const deckStore = proxy({
  decks: [] as IDeck[],

  get(deckName: string) {
    return deckStore.decks.find((deck) => deck.deckName === deckName);
  },

  async update(deckName: string, deck: IDeck): Promise<boolean> {
    const index = deckStore.decks.findIndex(
      (deck) => deck.deckName === deckName
    );
    if (index === -1) return false;
    deckStore.decks[index] = deck;
    await del(deckName, deckIdb); // 新的名字可能和旧的名字不一样，所以要删除旧的，再添加
    await set(deck.deckName, deck, deckIdb);
    return true;
  },

  async add(deck: IDeck): Promise<boolean> {
    if (deckStore.decks.find((d) => d.deckName === deck.deckName)) return false;
    deckStore.decks.push(deck);
    await set(deck.deckName, deck, deckIdb);
    return true;
  },

  async delete(deckName: string): Promise<boolean> {
    const index = deckStore.decks.findIndex(
      (deck) => deck.deckName === deckName
    );
    if (index === -1) return false;
    deckStore.decks.splice(index, 1);
    await del(deckName, deckIdb);
    return true;
  },

  async initialize() {
    deckStore.decks = await values<IDeck>(deckIdb);
    if (!deckStore.decks.length) {
      // 给玩家预设了几套卡组，一旦idb为空，就会给玩家添加这几套卡组
      const PRESET_DECKS: Record<string, { default: Omit<IDeck, "deckName"> }> =
        import.meta.glob("/neos-assets/structure-decks/*.ydk", {
          eager: true,
        });
      for (const key in PRESET_DECKS) {
        const deck = PRESET_DECKS[key].default;
        const deckName =
          key.split("/").pop()?.split(".").slice(0, -1).join(".") ??
          "undefined"; // 从路径解析文件名
        await deckStore.add({ ...deck, deckName });
      }
    }
  },
  async reset() {
    deckStore.decks = [];
    await clear(deckIdb);
  },
}) satisfies NeosStore;
