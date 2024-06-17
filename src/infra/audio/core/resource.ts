import { clear, createStore, del, get, set } from "idb-keyval";

import { useConfig } from "@/config";

import { AudioActionType } from "../type";

const AUDIO_DB_NAME = "audio";
const sourceDb = createStore(AUDIO_DB_NAME, "sources");

const { assetsPath } = useConfig();

/** 从网络加载音频资源 */
async function loadFromNet(name: string) {
  const prefix = `${assetsPath}/sound/`;
  const response = await fetch(`${prefix}${name}`);
  const fileBlob = await response.arrayBuffer();
  cacheResource(name, fileBlob);
  return fileBlob;
}

/** 从缓存中加载音频资源 */
function loadFromCache(name: string) {
  return get(name, sourceDb);
}

/** 缓存资源 */
function cacheResource(name: string, fileBlob: ArrayBuffer) {
  set(name, fileBlob, sourceDb);
}

/** 加载音频资源 */
export async function loadAudio(name: string) {
  // 从缓存资源获取
  const cachedFile = await loadFromCache(name);
  if (cachedFile) {
    return cachedFile;
  }

  // 从网络获取
  const fileBlob = await loadFromNet(name);
  return fileBlob;
}

/** 移除音频资源 */
export async function removeAudio(name: string) {
  try {
    await del(name, sourceDb);
  } catch {
    // 资源未落库，不做处理
  }
}

/** 清空音频缓存 */
export async function clearAudioCache() {
  return clear(sourceDb);
}

/** 获取音效名称 */
export function getEffectName(effect: AudioActionType) {
  switch (effect) {
    /** ******************** effect ********************/
    case AudioActionType.SOUND_SUMMON:
      return "summon.wav";
    case AudioActionType.SOUND_SPECIAL_SUMMON:
      return "specialsummon.wav";
    case AudioActionType.SOUND_ACTIVATE:
      return "activate.wav";
    case AudioActionType.SOUND_SET:
      return "set.wav";
    case AudioActionType.SOUND_FILP:
      return "flip.wav";
    case AudioActionType.SOUND_REVEAL:
      return "reveal.wav";
    case AudioActionType.SOUND_EQUIP:
      return "equip.wav";
    case AudioActionType.SOUND_DESTROYED:
      return "destroyed.wav";
    case AudioActionType.SOUND_BANISHED:
      return "banished.wav";
    case AudioActionType.SOUND_TOKEN:
      return "token.wav";
    case AudioActionType.SOUND_ATTACK:
      return "attack.wav";
    case AudioActionType.SOUND_DIRECT_ATTACK:
      return "directattack.wav";
    case AudioActionType.SOUND_DRAW:
      return "draw.wav";
    case AudioActionType.SOUND_SHUFFLE:
      return "shuffle.wav";
    case AudioActionType.SOUND_DAMAGE:
      return "damage.wav";
    case AudioActionType.SOUND_RECOVER:
      return "gainlp.wav";
    case AudioActionType.SOUND_COUNTER_ADD:
      return "addcounter.wav";
    case AudioActionType.SOUND_COUNTER_REMOVE:
      return "removecounter.wav";
    case AudioActionType.SOUND_COIN:
      return "coinflip.wav";
    case AudioActionType.SOUND_DICE:
      return "diceroll.wav";
    case AudioActionType.SOUND_NEXT_TURN:
      return "nextturn.wav";
    case AudioActionType.SOUND_PHASE:
      return "phase.wav";
    case AudioActionType.SOUND_MENU:
      return "menu.wav";
    case AudioActionType.SOUND_BUTTON:
      return "button.wav";
    case AudioActionType.SOUND_INFO:
      return "info.wav";
    case AudioActionType.SOUND_QUESTION:
      return "question.wav";
    case AudioActionType.SOUND_CARD_PICK:
      return "cardpick.wav";
    case AudioActionType.SOUND_CARD_DROP:
      return "carddrop.wav";
    case AudioActionType.SOUND_PLAYER_ENTER:
      return "playerenter.wav";
    case AudioActionType.SOUND_CHAT:
      return "chatmessage.wav";
    default:
      return "";
  }
}

/** 获取音乐名称 */
export function getMusicName(music: AudioActionType, current?: string) {
  let res: string[] = [];
  switch (music) {
    /** ******************** bgm ********************/
    case AudioActionType.BGM_MENU:
      res = [
        "BGM/menu/福田康文 - ディスク：1.mp3",
        "BGM/menu/光宗信吉 - 伝説の决闘(デュエル)(D3).mp3",
        "BGM/menu/蓑部雄崇 - 十代のテーマ.mp3",
      ];
      break;
    case AudioActionType.BGM_DECK:
      res = ["BGM/deck/bgm_deck.mp3", "BGM/deck/bgm_shop.mp3"];
      break;
    case AudioActionType.BGM_DUEL:
      res = [
        "BGM/duel/蓑部雄崇 - 悲しいデュエル.mp3",
        "BGM/duel/蓑部雄崇 - 鬼柳京介.mp3",
        "BGM/duel/蓑部雄崇 - 游星バトル.mp3",
        "BGM/duel/蓑部雄崇 - スピードワールド.mp3",
        "BGM/duel/中川幸太郎 - 不動のデュエル.mp3",
        "BGM/duel/中川幸太郎 - 反逆のデュエル.mp3",
      ];
      break;
    case AudioActionType.BGM_ADVANTAGE:
      res = [
        "BGM/advantage/池頼広 - 熱き決闘者たち (Re-arranged).mp3",
        "BGM/advantage/蓑部雄崇 - 游星テーマ.mp3",
        "BGM/advantage/蓑部雄崇 - ピンチ!.mp3",
      ];
      break;
    case AudioActionType.BGM_DISADVANTAGE:
      res = [
        "BGM/disadvantage/池頼広 - 神の怒り (Re-arranged：type one).mp3",
        "BGM/disadvantage/光宗信吉 - 热き决闘者たち.mp3",
        "BGM/disadvantage/蓑部雄崇 - 逆転の一手!.mp3",
      ];
      break;
    case AudioActionType.BGM_WIN:
      res = ["BGM/win/bgm_result.mp3"];
      break;
    case AudioActionType.BGM_LOSE:
      res = ["BGM/lose/bgm_result_lose1.mp3"];
      break;

    default:
      break;
  }
  const filterRes = res.filter((name) => name !== current);
  return filterRes[Math.floor(Math.random() * filterRes.length)];
}
