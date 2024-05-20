import { settingStore } from "@/stores/settingStore";

import { audioContextManger } from "../core/manager";
import { AudioActionType } from "../type";

export function playEffect(effect: AudioActionType) {
  if (!settingStore.audio.enableSoundEffects) return;
  return audioContextManger.playEffect(
    effect,
    settingStore.audio.soundEffectsVolume,
  );
}
