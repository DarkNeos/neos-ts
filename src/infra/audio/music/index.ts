import { subscribe } from "valtio";

import { settingStore } from "@/stores/settingStore";

import { audioContextManger } from "../core/manager";
import { AudioActionType } from "../type";

// 监听设置改动
subscribe(settingStore.audio, (opts) => {
  for (let [_op, path, newValue] of opts) {
    if (
      path.includes("enableMusic") &&
      newValue !== audioContextManger.enableBGM
    ) {
      audioContextManger.switchDisableMusic();
    }

    if (path.includes("musicVolume")) {
      audioContextManger.updateMusicVolume(newValue as number);
    }
  }
});

// 切换场景
export function changeScene(scene: AudioActionType) {
  if (
    // 场景切换
    audioContextManger.scene !== scene &&
    // 允许跟随场景切换音乐
    settingStore.audio.enableMusicSwitchByEnv
  ) {
    audioContextManger.scene = scene;
  }
}

// 初始化音频设置
function initAudioSetting() {
  audioContextManger.updateMusicVolume(settingStore.audio.musicVolume);
  audioContextManger.enableBGM = settingStore.audio.enableMusic ?? false;
}

initAudioSetting();
