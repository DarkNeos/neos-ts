import { AudioActionType } from "../type";
import { NeosAudioContext } from "./context";
import {
  getEffectName,
  getMusicName,
  loadAudio,
  removeAudio,
} from "./resource";

class AudioManager {
  private musicContext = new NeosAudioContext();
  private effectContextSet: WeakSet<NeosAudioContext> = new WeakSet();
  /** 当前播放的音频路径 */
  private _currentMusicPath: string = "";
  private _scene: AudioActionType | null = null;
  private _musicVolume = 1;

  public enableBGM = false;
  public get scene() {
    return this._scene;
  }

  public set scene(scene: AudioActionType | null) {
    this._scene = scene;
    if (this.enableBGM) {
      this.playMusic();
    }
  }

  public async playMusic() {
    if (!this.enableBGM || !this._scene) return;
    if (!this.musicContext.closed) {
      this.musicContext.close();
    }
    this.musicContext = new NeosAudioContext(this._musicVolume);
    this.musicContext.once("ended", () => {
      this.playMusic();
    });
    const name = getMusicName(this._scene, this._currentMusicPath);
    try {
      const resource = await loadAudio(name);
      await this.musicContext.play(resource);
      this._currentMusicPath = name;
    } catch {
      // 音频资源有问题
      removeAudio(name);
    }
  }

  public async playEffect(effect: AudioActionType, volume = 1) {
    let name = getEffectName(effect);
    try {
      const audioContext = new NeosAudioContext(volume);
      audioContext.once("ended", () => {
        this.effectContextSet.delete(audioContext);
      });
      this.effectContextSet.add(audioContext);
      const resource = await loadAudio(name);
      await audioContext.play(resource);
    } catch {
      // 音频资源有问题
      removeAudio(name);
    }
  }

  public updateMusicVolume(volume = 1) {
    this._musicVolume = volume;
    this.musicContext.updateVolume(volume);
  }

  public enableMusic() {
    this.enableBGM = true;
    this.playMusic();
  }

  public disableMusic() {
    this.enableBGM = false;
    this.musicContext.suspend();
  }

  public switchDisableMusic() {
    if (this.enableBGM) {
      this.disableMusic();
    } else {
      this.enableMusic();
    }
  }
}

export const audioContextManger = new AudioManager();
