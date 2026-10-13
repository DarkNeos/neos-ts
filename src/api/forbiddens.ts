import { YGOProLFList, type YGOProLFListItem } from "ygopro-lflist-encode";

import { pfetch } from "@/infra/pfetch";
import { banlistStore, type DeckEnvironment } from "@/stores/banlistStore";

import type { CardMeta } from "./cards";

export class Forbidden {
  private tables = new Map<string, Map<number, number>>();
  private byKey = new Map<string, YGOProLFListItem>();
  private keys = new WeakMap<YGOProLFListItem, string>();
  items: YGOProLFListItem[] = [];

  constructor(readonly environment: DeckEnvironment) {}

  key(item: YGOProLFListItem) {
    let key = this.keys.get(item);
    if (!key) {
      key = `${item.getHash()}:${item.name}`;
      this.keys.set(item, key);
    }
    return key;
  }

  itemsFor(environment: DeckEnvironment = this.environment) {
    if (environment === "408") return this.items;
    // 正式资源用名称中的 TCG 标记区分两种环境，未标记的表属于 OCG。
    return this.items.filter(
      (item) => /\bTCG\b/i.test(item.name) === (environment === "tcg"),
    );
  }

  selectedFor(environment: DeckEnvironment = this.environment) {
    const items = this.itemsFor(environment);
    const preferred = this.byKey.get(banlistStore.selected[environment]);
    return preferred && items.includes(preferred) ? preferred : items[0];
  }

  get selected() {
    return this.selectedFor();
  }

  get time() {
    return this.selected?.name ?? "?";
  }

  async init(url: string): Promise<void> {
    this.load(await (await pfetch(url)).text());
  }

  load(text: string) {
    this.items = new YGOProLFList().fromText(text).items;
    this.keys = new WeakMap();
    this.byKey = new Map(this.items.map((item) => [this.key(item), item]));
    this.tables = new Map(
      this.items.map((item) => [
        this.key(item),
        new Map(item.entries.map(({ code, limit }) => [code, limit])),
      ]),
    );
    banlistStore.revision += 1;
  }

  select(key: string, environment: DeckEnvironment = this.environment) {
    if (this.itemsFor(environment).some((item) => this.key(item) === key))
      banlistStore.selected[environment] = key;
  }

  set(cardId: number, limitCount: number) {
    const item = this.selected;
    if (item) this.tables.get(this.key(item))?.set(cardId, limitCount);
  }

  get(
    card: CardMeta,
    hash?: number,
    environment: DeckEnvironment = this.environment,
  ): number | undefined {
    const item =
      hash === undefined
        ? this.selectedFor(environment)
        : this.items.find((item) => item.getHash() === hash >>> 0);
    const entries = item && this.tables.get(this.key(item));
    return entries?.get(card.id) ?? entries?.get(card.data.alias ?? 0);
  }
}

export const forbidden = new Forbidden("ocg");
export const forbidden_408 = new Forbidden("408");
