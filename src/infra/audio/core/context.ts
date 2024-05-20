import EventEmitter from "eventemitter3";

export class NeosAudioContext extends EventEmitter<AudioScheduledSourceNodeEventMap> {
  private _musicAudioContext = new AudioContext();
  private _gainNode = this._musicAudioContext.createGain();
  private _isClosed = false;

  constructor(volume = 1) {
    super();
    this._gainNode.gain.value = volume;
  }

  public get state() {
    return this._musicAudioContext.state;
  }

  public get closed() {
    return this._isClosed;
  }

  /**
   * 触发自动播放
   */
  private _triggerAutoPlay() {
    if (this.state === "suspended") {
      const autoPlay = () => {
        document.removeEventListener("click", autoPlay);
        this.resume();
      };
      document.addEventListener("click", autoPlay);
    }
  }

  /**
   * 监听未启播
   */
  private _observerPlayState(source: AudioBufferSourceNode) {
    // 50ms 未启播，说明播放失败了，重新尝试播放
    const timeout = setTimeout(async () => {
      if (source.loop) return;
      if (this.state === "closed") return;
      if (source.context.currentTime === 0) {
        await this.suspend();
        await this.resume();
      }
    }, 50);
    // 播放结束后关闭音频
    const Ended = () => {
      source.removeEventListener("ended", Ended);
      this.emit("ended");
      clearTimeout(timeout);
      this.close();
    };
    source.addEventListener("ended", Ended);
  }

  /**
   * 播放音频
   * @param audio 音频数据
   */
  public async play(audio: ArrayBuffer) {
    const source = this._musicAudioContext.createBufferSource();
    const buffer = await this._musicAudioContext.decodeAudioData(audio);
    source.buffer = buffer;

    source.connect(this._gainNode).connect(this._musicAudioContext.destination);
    source.start();
    this._triggerAutoPlay();
    this._observerPlayState(source);
  }

  public async resume() {
    if (this.state !== "suspended") return;
    return this._musicAudioContext.resume();
  }

  public async suspend() {
    if (this.state !== "running") return;
    return this._musicAudioContext.suspend();
  }

  public close() {
    if (this._isClosed) return;
    this._isClosed = true;
    return this._musicAudioContext.close();
  }

  public updateVolume(volume: number) {
    this._gainNode.gain.value = volume;
  }
}
