import { proxy } from "valtio";
import YGOProDeck from "ygopro-deck-encode";

import type { MdproDeck, MdproResp } from "../api/mdproDeck/schema";
import { updateCloudDeckYdk } from "../api/mdproDeck/ydk.ts";
import type { IDeck } from "./deckStore";
import type { DeckAccount } from "./onlineDecks";

export interface CloudDeckRecord extends MdproDeck {
  content?: IDeck;
  needsRefresh?: boolean;
}

export interface PersonalCloudDeckDependencies {
  list(account: DeckAccount): Promise<MdproResp<MdproDeck[]>>;
  detail(account: DeckAccount, id: string): Promise<MdproResp<MdproDeck>>;
  save(
    account: DeckAccount,
    deck: MdproDeck,
  ): Promise<MdproResp<"true" | "false">>;
  delete(account: DeckAccount, id: string): Promise<MdproResp<number>>;
  cache: {
    read(userId: number): Promise<CloudDeckRecord[] | undefined>;
    update(
      userId: number,
      change: (decks: CloudDeckRecord[]) => CloudDeckRecord[],
    ): Promise<void>;
  };
}

function parseDeck(deck: MdproDeck): IDeck | undefined {
  if (deck.deckYdk === undefined) return;
  const content = YGOProDeck.fromYdkString(
    deck.deckYdk.replace(/\\r\\n|\\r|\\n/g, "\n"),
  );
  return {
    deckName: deck.deckName,
    main: [...content.main],
    extra: [...content.extra],
    side: [...content.side],
  };
}

/** 个人云卡组的记录、账号归属、确认删除和离线缓存由同一处管理。 */
export class PersonalCloudDecks {
  readonly state = proxy({
    accountId: undefined as number | undefined,
    decks: [] as CloudDeckRecord[],
    loading: false,
    restoring: false,
    error: "",
  });
  private account?: DeckAccount;
  private initialized = false;
  private session = 0;
  private revision = 0;
  private ready?: Promise<void>;
  private reading?: Promise<void>;
  private details = new Map<string, Promise<IDeck>>();
  private deletions = new Map<string, Promise<void>>();
  private saving = new Set<string>();
  private deleted = new Set<string>();

  private dependencies: PersonalCloudDeckDependencies;

  constructor(dependencies: PersonalCloudDeckDependencies) {
    this.dependencies = dependencies;
  }

  private matches(account?: DeckAccount) {
    return (
      account?.id === this.account?.id && account?.token === this.account?.token
    );
  }

  isDeleted(deckId: string, userId = this.state.accountId) {
    return this.deleted.has(`${userId}:${deckId}`);
  }

  setAccount(next?: DeckAccount): Promise<void> {
    if (this.initialized && this.matches(next))
      return this.ready ?? Promise.resolve();
    this.initialized = true;
    const session = ++this.session;
    ++this.revision;
    this.account = next ? { ...next } : undefined;
    this.reading = undefined;
    this.details.clear();
    Object.assign(this.state, {
      accountId: next?.id,
      decks: [],
      loading: false,
      restoring: !!next,
      error: "",
    });
    this.ready = (async () => {
      if (!next) return;
      const cached = await this.dependencies.cache
        .read(next.id)
        .catch(() => undefined);
      if (session !== this.session) return;
      if (cached)
        this.state.decks = cached.filter(
          (deck) => !this.isDeleted(deck.deckId, next.id),
        );
      this.state.restoring = false;
      await this.refresh();
    })();
    return this.ready;
  }

  refresh(expected?: DeckAccount): Promise<void> {
    if (expected && !this.matches(expected))
      return Promise.reject(new Error("账号已切换，请重新加载卡组"));
    if (this.state.restoring && this.ready) return this.ready;
    if (this.reading) return this.reading;
    const owner = this.account;
    if (!owner) return Promise.resolve();
    const session = this.session;
    const revision = ++this.revision;
    this.state.loading = true;
    this.state.error = "";
    const operation = (async () => {
      const response = await this.dependencies.list(owner);
      if (session !== this.session || revision !== this.revision) return;
      if (response.code !== 0 || !response.data)
        throw new Error(
          response.message?.trim() || "刷新云卡组失败，请稍后重试",
        );
      const previous = this.state.decks;
      this.state.decks = response.data
        .filter(
          (deck) => !deck.isDelete && !this.isDeleted(deck.deckId, owner.id),
        )
        .map((deck) => {
          const cached = previous.find((item) => item.deckId === deck.deckId);
          const content = parseDeck(deck);
          return {
            ...cached,
            ...deck,
            deckYdk: deck.deckYdk ?? cached?.deckYdk,
            content:
              content ??
              (cached?.content
                ? { ...cached.content, deckName: deck.deckName }
                : undefined),
            needsRefresh: !content,
          };
        });
      await this.persist(owner.id);
    })()
      .catch((error) => {
        if (session === this.session && revision === this.revision)
          this.state.error =
            error instanceof Error
              ? error.message
              : "刷新云卡组失败，请检查网络后重试";
        throw error;
      })
      .finally(() => {
        if (this.reading === operation) this.reading = undefined;
        if (session === this.session && revision === this.revision)
          this.state.loading = false;
      });
    this.reading = operation;
    return operation;
  }

  resolve(deckId: string): Promise<IDeck> {
    const owner = this.account;
    const record = this.state.decks.find((deck) => deck.deckId === deckId);
    if (!owner || !record)
      return Promise.reject(new Error("卡组已不可用，请刷新列表"));
    if (record.content && !record.needsRefresh)
      return Promise.resolve(record.content);
    const pending = this.details.get(deckId);
    if (pending) return pending;
    const session = this.session;
    const revision = this.revision;
    const operation = (async () => {
      const response = await this.dependencies.detail(owner, deckId);
      if (session !== this.session)
        throw new Error("账号已切换，请重新选择卡组");
      const current = this.state.decks.find((deck) => deck.deckId === deckId);
      if (!current) throw new Error("卡组已不可用，请刷新列表");
      if (revision !== this.revision) {
        if (current.content) return current.content;
        throw new Error("卡组列表已更新，请重新选择");
      }
      if (response.code !== 0 || !response.data)
        throw new Error(response.message?.trim() || "加载卡组失败，请重试");
      const content = parseDeck({
        ...response.data,
        deckName: current.deckName,
      });
      if (!content) throw new Error("云端未返回卡组内容，请重试");
      Object.assign(current, response.data, {
        deckName: current.deckName,
        content,
        needsRefresh: false,
      });
      await this.persist(owner.id);
      return content;
    })()
      .catch((error) => {
        const current = this.state.decks.find((deck) => deck.deckId === deckId);
        if (session === this.session && current?.content) {
          this.state.error =
            error instanceof Error
              ? `更新卡组内容失败：${error.message}`
              : "更新卡组内容失败，请稍后重试";
          return current.content;
        }
        throw error;
      })
      .finally(() => {
        if (this.details.get(deckId) === operation) this.details.delete(deckId);
      });
    this.details.set(deckId, operation);
    return operation;
  }

  async save(deckId: string, deck: IDeck) {
    const owner = this.account;
    if (!owner) throw new Error("请先登录萌卡账号");
    const key = `${owner.id}:${deckId}`;
    if (this.saving.has(key)) throw new Error("请等待保存完成");
    if (this.deletions.has(key))
      throw new Error("正在删除卡组，请等待删除结果");
    const record = this.state.decks.find((item) => item.deckId === deckId);
    if (!record) throw new Error("云卡组已不可用，请刷新列表");
    if (record.deckYdk === undefined)
      throw new Error("未取得云卡组原始数据，请刷新后再保存");
    const session = this.session;
    const deckYdk = updateCloudDeckYdk(record.deckYdk, deck);
    const timestamp = Date.now();
    this.saving.add(key);
    try {
      const response = await this.dependencies.save(owner, {
        ...record,
        deckName: deck.deckName,
        deckYdk,
        deckUpdateDate: timestamp,
      });
      if (session !== this.session)
        throw new Error("账号已切换，请在原账号中确认保存结果");
      if (response.code !== 0 || response.data !== "true")
        throw new Error(response.message?.trim() || "云端未确认保存，请重试");
      this.invalidateReads();
      const current = this.state.decks.find((item) => item.deckId === deckId);
      if (current)
        Object.assign(current, {
          deckName: deck.deckName,
          deckYdk,
          content: deck,
          needsRefresh: false,
          deckUpdateDate: timestamp,
        });
      await this.persist(owner.id);
    } finally {
      this.saving.delete(key);
    }
  }

  delete(deckId: string, expectedAccountId: number): Promise<void> {
    const owner = this.account;
    if (!owner || owner.id !== expectedAccountId)
      return Promise.reject(new Error("账号已切换，请重新打开删除确认"));
    const key = `${owner.id}:${deckId}`;
    if (this.saving.has(key))
      return Promise.reject(new Error("请等待保存完成后再删除"));
    const pending = this.deletions.get(key);
    if (pending) return pending;
    const operation = (async () => {
      const response = await this.dependencies.delete(owner, deckId);
      if (response.code !== 0 || response.data !== 1)
        throw new Error(
          response.message?.trim() ||
            "删除卡组失败，服务器未确认删除，请稍后重试。",
        );
      this.deleted.add(key);
      if (this.account?.id === owner.id) {
        this.invalidateReads();
        this.state.decks = this.state.decks.filter(
          (deck) => deck.deckId !== deckId,
        );
      }
      await this.dependencies.cache
        .update(owner.id, (decks) =>
          decks.filter((deck) => deck.deckId !== deckId),
        )
        .catch(() => undefined);
    })().finally(() => this.deletions.delete(key));
    this.deletions.set(key, operation);
    return operation;
  }

  private invalidateReads() {
    ++this.revision;
    this.reading = undefined;
    this.state.loading = false;
  }

  private async persist(userId: number) {
    const decks: CloudDeckRecord[] = JSON.parse(
      JSON.stringify(this.state.decks),
    );
    await this.dependencies.cache
      .update(userId, () =>
        decks.filter((deck) => !this.isDeleted(deck.deckId, userId)),
      )
      .catch(() => undefined);
  }
}
