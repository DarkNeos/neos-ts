import Fuse from "fuse.js";
import { proxy } from "valtio";

import type {
  MdproDeck,
  MdproDeckLike,
  MdproResp,
} from "../api/mdproDeck/schema";

export interface DeckAccount {
  id: number;
  token: string;
  username: string;
}
export interface OnlineDeckTransport {
  isDeleted(deckId: string, accountId?: number): boolean;
  publicList(
    query: string,
    page: number,
    size: number,
  ): Promise<
    MdproResp<{ records: MdproDeckLike[]; total: number }> | undefined
  >;
  personalList(
    account: DeckAccount,
  ): Promise<MdproResp<MdproDeck[]> | undefined>;
  delete(account: DeckAccount, deckId: string): Promise<void>;
}
interface DeletionResult {
  ok: boolean;
  message: string;
}
const PAGE_SIZE = 30;

/** 查询归属、分页与删除一致性；调用方只消费当前列表与操作结果。 */
export class OnlineDecks {
  readonly pageSize = PAGE_SIZE;
  readonly state = proxy({
    query: "",
    page: 1,
    decks: [] as MdproDeckLike[],
    total: 0,
    onlyMine: false,
    loaded: false,
    error: "",
    errorRevision: 0,
  });
  private account?: DeckAccount;
  // 每次实际读取递增；旧查询的成功、失败和加载结束都不能更新当前列表。
  private revision = 0;
  private deletions = new Map<string, Promise<DeletionResult>>();
  private pendingRead?: { key: string; promise: Promise<void> };
  private transport: OnlineDeckTransport;

  constructor(transport: OnlineDeckTransport) {
    this.transport = transport;
  }

  setAccount(account?: DeckAccount) {
    if (
      account?.id === this.account?.id &&
      account?.token === this.account?.token &&
      account?.username === this.account?.username
    )
      return;
    this.account = account ? { ...account } : undefined;
    // 公共请求不依赖账号；个人列表切换账号后重新读取，使旧结果失效。
    if (this.state.onlyMine) return this.load();
  }

  search(query: string, onlyMine = this.state.onlyMine) {
    if (query !== this.state.query || onlyMine !== this.state.onlyMine)
      this.state.page = 1;
    this.state.query = query;
    this.state.onlyMine = onlyMine;
    return this.load();
  }

  setPage(page: number) {
    this.state.page = Math.max(1, page);
    return this.load();
  }

  load() {
    const { query, page, onlyMine } = this.state;
    const key = JSON.stringify([
      query,
      page,
      onlyMine,
      onlyMine ? this.account : undefined,
    ]);
    // 布局初始化和列表挂载可能同时加载，相同条件共用同一个在途请求。
    if (this.pendingRead?.key === key) return this.pendingRead.promise;
    const promise = this.read(false).finally(() => {
      // 旧请求结束时不能清空已经被新查询替换的等待句柄。
      if (this.pendingRead?.promise === promise) this.pendingRead = undefined;
    });
    this.pendingRead = { key, promise };
    return promise;
  }

  delete(deckId: string): Promise<DeletionResult> {
    const account = this.account;
    if (!account)
      return Promise.resolve({
        ok: false,
        message: "需要先登录萌卡才能删除卡组。",
      });
    // 同账号的重复删除共用结果，切换账号后仍允许发起该账号自己的请求。
    const key = `${account.id}:${deckId}`;
    const pending = this.deletions.get(key);
    if (pending) return pending;
    const operation = this.remove(account, deckId).finally(() =>
      this.deletions.delete(key),
    );
    this.deletions.set(key, operation);
    return operation;
  }

  isDeleted(deckId: string) {
    return this.transport.isDeleted(deckId, this.account?.id);
  }

  // 共享记录发生保存或删除时，只更新当前查询的结果，不重复请求云端。
  reconcileRecords(accountId: number | undefined, decks: MdproDeck[]) {
    if (!this.state.loaded || accountId !== this.account?.id) return;
    if (this.state.onlyMine) this.applyPersonal(decks);
    else {
      const previous = this.state.decks.length;
      this.state.decks = this.state.decks.filter(
        (deck) => !this.isDeleted(deck.deckId),
      );
      this.state.total = Math.max(
        0,
        this.state.total - (previous - this.state.decks.length),
      );
    }
  }

  private applyPersonal(records: MdproDeck[]) {
    const { query, page } = this.state;
    let decks = records.filter(
      (deck) => !deck.isDelete && !this.isDeleted(deck.deckId),
    );
    if (query)
      decks = new Fuse(decks, {
        keys: ["deckName"],
        includeScore: true,
        threshold: 0.3,
      })
        .search(query)
        .map((result) => result.item);
    this.state.total = decks.length;
    this.state.page = Math.min(
      page,
      Math.max(1, Math.ceil(decks.length / PAGE_SIZE)),
    );
    this.state.decks = decks.slice(
      (this.state.page - 1) * PAGE_SIZE,
      this.state.page * PAGE_SIZE,
    );
  }

  private async read(keepResults: boolean) {
    this.pendingRead = undefined;
    const revision = ++this.revision;
    const { query, page, onlyMine } = this.state;
    const account = this.account;
    this.state.error = "";
    if (!keepResults) {
      this.state.loaded = false;
      this.state.decks = [];
      this.state.total = 0;
    }
    try {
      if (onlyMine) {
        if (!account)
          throw new Error("需要先登录萌卡账号才能查看自己的在线卡组");
        const response = await this.transport
          .personalList(account)
          .catch(() => undefined);
        if (revision !== this.revision) return;
        if (!response || response.code !== 0 || !response.data)
          throw new Error(
            response?.message?.trim() ||
              "获取个人卡组列表失败，请检查网络或稍后重试。",
          );
        // 个人接口返回全部记录，查询、删除过滤和分页在本地统一计算。
        this.applyPersonal(response.data);
      } else {
        const response = await this.transport
          .publicList(query, page, PAGE_SIZE)
          .catch(() => undefined);
        if (revision !== this.revision) return;
        if (!response || response.code !== 0 || !response.data)
          throw new Error(
            response?.message?.trim() ||
              "获取在线卡组失败，请检查网络或稍后重试。",
          );
        this.state.decks = response.data.records.filter(
          (deck) => !this.isDeleted(deck.deckId),
        );
        this.state.total = response.data.total;
      }
    } catch (error) {
      if (revision !== this.revision) return;
      this.state.error =
        error instanceof Error
          ? error.message
          : "获取在线卡组失败，请检查网络或稍后重试。";
      this.state.errorRevision += 1;
    } finally {
      if (revision === this.revision) this.state.loaded = true;
    }
  }

  private async remove(
    account: DeckAccount,
    deckId: string,
  ): Promise<DeletionResult> {
    try {
      await this.transport.delete(account, deckId);
      if (
        account.id !== this.account?.id ||
        account.token !== this.account?.token
      )
        return { ok: true, message: "删除卡组成功" };
      const previous = this.state.decks.length;
      this.state.decks = this.state.decks.filter(
        (deck) => deck.deckId !== deckId,
      );
      this.state.total = Math.max(
        0,
        this.state.total - (previous - this.state.decks.length),
      );
      // 保留当前列表，并使删除前的读取结果失效。
      if (this.state.onlyMine) await this.read(true);
      return { ok: true, message: "删除卡组成功" };
    } catch (error) {
      return {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "删除卡组请求未完成，请检查网络或稍后重试。",
      };
    }
  }
}
