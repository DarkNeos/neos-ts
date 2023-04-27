import { ygopro } from "@/api";

export function CardZoneToChinese(zone: ygopro.CardZone): string {
  switch (zone) {
    case ygopro.CardZone.DECK: {
      return "卡组";
    }
    case ygopro.CardZone.HAND: {
      return "手牌";
    }
    case ygopro.CardZone.EXTRA: {
      return "额外卡组";
    }
    case ygopro.CardZone.GRAVE: {
      return "墓地";
    }
    case ygopro.CardZone.FZONE: {
      return "FZONE";
    }
    case ygopro.CardZone.MZONE: {
      return "怪兽区";
    }
    case ygopro.CardZone.SZONE: {
      return "魔法陷阱区";
    }
    case ygopro.CardZone.REMOVED: {
      return "除外区";
    }
    case ygopro.CardZone.OVERLAY: {
      return "超量区";
    }
    case ygopro.CardZone.PZONE: {
      return "灵摆区";
    }
    case ygopro.CardZone.ONFIELD: {
      return "场地区";
    }
    default: {
      return "未知区域";
    }
  }
}
