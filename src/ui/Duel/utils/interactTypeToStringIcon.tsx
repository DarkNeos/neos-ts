import { ygopro } from "@/api";
import { InteractType } from "@/stores";
import { IconFont } from "@/ui/Shared";

import CardPosition = ygopro.CardPosition;

const language = localStorage.getItem("language");

export function interactTypeToString(t: InteractType): string {
  const sSet = language !== "cn" ? "Set" : "后场放置";
  const summon = language !== "cn" ? "Normal Summon" : "普通召唤";
  const spSummon = language !== "cn" ? "Special Summon" : "特殊召唤";
  const posChange = language !== "cn" ? "Change Position" : "改变表示形式";
  const mSet = language !== "cn" ? "Set" : "前场放置";
  const activate = language !== "cn" ? "Activate" : "发动效果";
  const attack = language !== "cn" ? "Attack" : "攻击";

  switch (t) {
    case InteractType.SUMMON:
      return summon;
    case InteractType.SP_SUMMON:
      return spSummon;
    case InteractType.POS_CHANGE:
      return posChange;
    case InteractType.MSET:
      return mSet;
    case InteractType.SSET:
      return sSet;
    case InteractType.ACTIVATE:
      return activate;
    case InteractType.ATTACK:
      return attack;
    default:
      return "未知选项";
  }
}

const Icon: React.FC<{ type: string; size?: number }> = ({
  type,
  size = 24,
}) => (
  <IconFont
    type={type}
    size={size}
    style={{
      width: 24,
      height: 30,
      marginRight: 6,
      justifyContent: "center",
    }}
  />
);

export function interactTypeToIcon(
  t: InteractType,
  position?: CardPosition,
): JSX.Element {
  switch (t) {
    case InteractType.POS_CHANGE:
      if (position === CardPosition.FACEDOWN_ATTACK)
        return <IconFont type="icon-back-defence" />;
      else if (position === CardPosition.FACEDOWN_DEFENSE)
        return <IconFont type="icon-back" size={22} />;
      else if (position === CardPosition.FACEUP_DEFENSE)
        return <IconFont type="icon-front" size={22} />;
      return <Icon type="icon-front-defence" />;
    case InteractType.MSET:
      return <Icon type="icon-back-defence" />;
    case InteractType.SSET:
      return <Icon type="icon-back" size={22} />;
    case InteractType.ACTIVATE:
      return <Icon type="icon-activate" />;
    case InteractType.ATTACK:
      return <Icon type="icon-attack" size={20} />;
    case InteractType.SUMMON:
    case InteractType.SP_SUMMON:
    default:
      return <Icon type="icon-summon" size={20} />;
  }
}
