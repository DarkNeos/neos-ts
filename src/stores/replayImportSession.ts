import { proxy } from "valtio";

export interface PreparedReplay<D> {
  decks: D[];
  deckError: string;
  replay?: ArrayBuffer;
}

export interface ReplayImportOptions {
  signal?: AbortSignal;
  onProgress?: (text: string) => void;
}

interface ReplayImportAdapter<D> {
  prepare: (
    data: ArrayBuffer,
    mode: "play" | "extract",
    options: ReplayImportOptions,
  ) => Promise<PreparedReplay<D>>;
  publishDecks: (result: PreparedReplay<D>) => void;
  startPlayback: (data: ArrayBuffer, signal: AbortSignal) => Promise<boolean>;
}

/** 文件读取、处理和发布属于同一会话；失效任务不能更新界面或开始播放。 */
export class ReplayImportSession<D> {
  readonly state = proxy({
    hasFile: false,
    busy: false,
    progress: "",
    error: "",
    started: false,
  });
  private data?: ArrayBuffer;
  private controller?: AbortController;
  private readonly adapter: ReplayImportAdapter<D>;

  constructor(adapter: ReplayImportAdapter<D>) {
    this.adapter = adapter;
  }

  async select(file: ArrayBuffer | Pick<Blob, "arrayBuffer">) {
    this.cancel();
    this.data = undefined;
    this.state.hasFile = false;
    this.adapter.publishDecks({ decks: [], deckError: "" });
    const active = this.begin();
    this.state.progress = "正在读取录像文件";
    try {
      const data =
        file instanceof ArrayBuffer ? file : await file.arrayBuffer();
      if (!this.isCurrent(active)) return;
      this.data = data;
      this.state.hasFile = true;
    } catch (error) {
      this.fail(active, error);
    } finally {
      this.finish(active);
    }
  }

  async run(mode: "play" | "extract", options: ReplayImportOptions = {}) {
    if (!this.data || options.signal?.aborted) return false;
    const data = this.data;
    this.cancel();
    const active = this.begin();
    const cancel = () => {
      if (this.isCurrent(active)) this.cancel();
    };
    options.signal?.addEventListener("abort", cancel, { once: true });
    try {
      const result = await this.adapter.prepare(data, mode, {
        signal: active.signal,
        onProgress: (text) => {
          if (!this.isCurrent(active)) return;
          this.state.progress = text;
          options.onProgress?.(text);
        },
      });
      if (!this.isCurrent(active)) return false;
      if (mode === "play" && !result.replay)
        throw new Error("录像没有生成播放数据");
      this.adapter.publishDecks(result);
      if (mode === "play") {
        const connected = await this.adapter.startPlayback(
          result.replay!,
          active.signal,
        );
        if (!connected || !this.isCurrent(active)) return false;
        this.state.started = true;
      }
      return this.isCurrent(active);
    } catch (error) {
      this.fail(active, error);
      return false;
    } finally {
      options.signal?.removeEventListener("abort", cancel);
      this.finish(active);
    }
  }

  cancel() {
    this.controller?.abort();
    this.controller = undefined;
    this.state.busy = false;
    this.state.progress = "";
    this.state.error = "";
    this.state.started = false;
  }

  private begin() {
    const active = new AbortController();
    this.controller = active;
    this.state.busy = true;
    return active;
  }

  private isCurrent(active: AbortController) {
    return this.controller === active && !active.signal.aborted;
  }

  private fail(active: AbortController, error: unknown) {
    if (this.isCurrent(active))
      this.state.error =
        error instanceof Error ? error.message : "录像加载失败";
  }

  private finish(active: AbortController) {
    if (!this.isCurrent(active)) return;
    this.controller = undefined;
    this.state.busy = false;
    this.state.progress = "";
  }
}
