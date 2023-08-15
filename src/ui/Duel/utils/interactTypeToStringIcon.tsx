import { ygopro } from "@/api";
import { InteractType } from "@/stores";
import { IconFont } from "@/ui/Shared";

import CardPosition = ygopro.CardPosition;

export function interactTypeToString(t: InteractType): string {
  switch (t) {
    case InteractType.SUMMON:
      return "普通召唤";
    case InteractType.SP_SUMMON:
      return "特殊召唤";
    case InteractType.POS_CHANGE:
      return "改变表示形式";
    case InteractType.MSET:
      return "前场放置";
    case InteractType.SSET:
      return "后场放置";
    case InteractType.ACTIVATE:
      return "发动效果";
    case InteractType.ATTACK:
      return "攻击";
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
