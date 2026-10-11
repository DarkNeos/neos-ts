import { proxy } from "valtio";

import type { IDeck } from "./deckStore";

export interface DraftSource {
  id: string;
  deck: IDeck;
}
export type OpenDraftResult = "selected" | "confirm" | "ignored";
interface DraftDependencies<T> {
  editor: {
    read(): IDeck;
    prepare(deck: IDeck): Promise<T>;
    apply(deck: T): void;
    rename(name: string): void;
    edited: boolean;
  };
  current(): { accountId?: number; entry?: DraftSource; deleted: boolean };
  select(id: string): Promise<IDeck | undefined>;
  preview(id: string): Promise<DraftSource>;
  save(source: DraftSource, deck: IDeck): Promise<DraftSource>;
  copy(deck: IDeck): Promise<DraftSource>;
}
const empty = (): IDeck => ({ deckName: "", main: [], extra: [], side: [] });
const copy = (deck: IDeck): IDeck => ({
  deckName: deck.deckName,
  main: [...deck.main],
  extra: [...deck.extra],
  side: [...deck.side],
});

/** 草稿身份、加载、后台刷新与保存版本共用同一个生命周期。 */
export class DeckDraft<T> {
  readonly state = proxy({
    deck: empty(),
    entryId: "",
    accountId: undefined as number | undefined,
    saving: false,
    loading: false,
    error: "",
  });
  private generation = 0;
  private suspended = false;

  private dependencies: DraftDependencies<T>;

  constructor(dependencies: DraftDependencies<T>) {
    this.dependencies = dependencies;
  }

  async sync() {
    const { accountId, entry, deleted } = this.dependencies.current();
    const changedAccount = this.state.accountId !== accountId;
    if (changedAccount || deleted) {
      ++this.generation;
      this.suspended = false;
      Object.assign(this.state, {
        accountId,
        deck: empty(),
        entryId: "",
        saving: false,
        loading: false,
        error: "",
      });
      this.dependencies.editor.edited = false;
      await this.open(entry?.deck ?? empty(), entry?.id ?? "");
      return;
    }
    if (
      this.suspended ||
      this.dependencies.editor.edited ||
      this.state.saving ||
      this.state.loading ||
      this.state.entryId === "preview"
    )
      return;
    if (
      entry &&
      (entry.id !== this.state.entryId || entry.deck !== this.state.deck)
    )
      await this.open(entry.deck, entry.id);
  }

  select(id: string, discard = false): Promise<OpenDraftResult> {
    if (id === this.state.entryId) return Promise.resolve("ignored");
    return this.change(
      () =>
        this.dependencies
          .select(id)
          .then((deck) => (deck ? { id, deck } : undefined)),
      discard,
    );
  }

  preview(id: string, discard = false): Promise<OpenDraftResult> {
    return this.change(() => this.dependencies.preview(id), discard);
  }

  private async change(
    load: () => Promise<DraftSource | undefined>,
    discard: boolean,
  ): Promise<OpenDraftResult> {
    if (this.state.saving) return "ignored";
    if (this.dependencies.editor.edited && !discard) return "confirm";
    const generation = ++this.generation;
    const before = JSON.stringify(this.dependencies.editor.read());
    this.state.loading = true;
    try {
      const source = await load();
      if (!source || generation !== this.generation) return "ignored";
      return (await this.install(source.deck, source.id, generation, before))
        ? "selected"
        : "ignored";
    } finally {
      if (generation === this.generation) this.state.loading = false;
    }
  }

  async open(deck: IDeck, id: string) {
    const generation = ++this.generation;
    const before = JSON.stringify(this.dependencies.editor.read());
    this.state.loading = true;
    try {
      return await this.install(deck, id, generation, before);
    } finally {
      if (generation === this.generation) this.state.loading = false;
    }
  }

  private async install(
    deck: IDeck,
    id: string,
    generation: number,
    before: string,
  ) {
    const prepared = await this.dependencies.editor.prepare(deck);
    if (
      generation !== this.generation ||
      this.suspended ||
      before !== JSON.stringify(this.dependencies.editor.read())
    )
      return false;
    this.dependencies.editor.apply(prepared);
    Object.assign(this.state, {
      deck,
      entryId: id,
      accountId: this.dependencies.current().accountId,
      error: "",
    });
    return true;
  }

  async reset() {
    if (this.state.saving || this.state.loading) return false;
    return this.open(this.state.deck, this.state.entryId);
  }

  save() {
    return this.persist(false);
  }
  saveLocalCopy() {
    return this.persist(true);
  }

  private async persist(localCopy: boolean): Promise<DraftSource | undefined> {
    if (this.state.saving || this.state.loading) return;
    const deck = copy(this.dependencies.editor.read());
    if (!deck.deckName.trim()) throw new Error("请填写卡组名称");
    const generation = this.generation;
    const source = { id: this.state.entryId, deck: this.state.deck };
    this.state.saving = true;
    this.state.error = "";
    try {
      const saved = await (localCopy
        ? this.dependencies.copy(deck)
        : this.dependencies.save(source, deck));
      if (generation !== this.generation) return;
      // 保存期间的新修改仍属于当前草稿，成功响应只更新保存时的基准版本。
      if (
        JSON.stringify(this.dependencies.editor.read()) === JSON.stringify(deck)
      ) {
        this.dependencies.editor.rename(saved.deck.deckName);
        this.dependencies.editor.edited = false;
      }
      Object.assign(this.state, { deck: saved.deck, entryId: saved.id });
      return saved;
    } catch (error) {
      if (generation === this.generation)
        this.state.error =
          error instanceof Error ? error.message : "保存失败，请重试";
      throw error;
    } finally {
      if (generation === this.generation) this.state.saving = false;
    }
  }

  suspend() {
    this.suspended = true;
  }
  resume() {
    this.suspended = false;
  }
}
