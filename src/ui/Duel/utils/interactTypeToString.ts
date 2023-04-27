import { InteractType } from "@/stores";

export function interactTypeToString(t: InteractType): string {
  switch (t) {
    case InteractType.SUMMON: {
      return "普通召唤";
    }
    case InteractType.SP_SUMMON: {
      return "特殊召唤";
    }
    case InteractType.POS_CHANGE: {
      return "改变表示形式";
    }
    case InteractType.MSET: {
      return "前场放置";
    }
    case InteractType.SSET: {
      return "后场放置";
    }
    case InteractType.ACTIVATE: {
      return "发动效果";
    }
    case InteractType.ATTACK: {
      return "攻击";
    }
    default: {
      return "未知选项";
    }
  }
}
