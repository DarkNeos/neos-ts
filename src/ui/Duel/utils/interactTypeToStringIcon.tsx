import { ygopro } from "@/api";
import { InteractType } from "@/stores";
import { IconFont } from "@/ui/Shared";

import CardPosition = ygopro.CardPosition;

// Define the possible language codes (I18N)
type Language = "en" | "br" | "pt" | "fr" | "ja" | "ko" | "es" | "cn";

// Define the structure for the messages (I18N)
const messages: Record<
  Language,
  {
    sSet: string;
    summon: string;
    spSummon: string;
    posChange: string;
    mSet: string;
    activate: string;
    attack: string;
  }
> = {
  en: {
    sSet: "Set",
    summon: "Normal Summon",
    spSummon: "Special Summon",
    posChange: "Change Position",
    mSet: "Set",
    activate: "Activate",
    attack: "Attack",
  },
  br: {
    sSet: "Setar",
    summon: "Invocação Normal",
    spSummon: "Invocação Especial",
    posChange: "Mudar Posição",
    mSet: "Setar",
    activate: "Ativar",
    attack: "Atacar",
  },
  pt: {
    sSet: "Setar",
    summon: "Invocação Normal",
    spSummon: "Invocação Especial",
    posChange: "Mudar Posição",
    mSet: "Setar",
    activate: "Ativar",
    attack: "Atacar",
  },
  fr: {
    sSet: "Poser",
    summon: "Invocation Normale",
    spSummon: "Invocation Spéciale",
    posChange: "Changer de Position",
    mSet: "Poser",
    activate: "Activer",
    attack: "Attaquer",
  },
  ja: {
    sSet: "セット",
    summon: "通常召喚",
    spSummon: "特殊召喚",
    posChange: "表示形式変更",
    mSet: "セット",
    activate: "発動",
    attack: "攻撃",
  },
  ko: {
    sSet: "세트",
    summon: "일반 소환",
    spSummon: "특수 소환",
    posChange: "포지션 변경",
    mSet: "세트",
    activate: "발동",
    attack: "공격",
  },
  es: {
    sSet: "Colocar",
    summon: "Invocación Normal",
    spSummon: "Invocación Especial",
    posChange: "Cambiar Posición",
    mSet: "Colocar",
    activate: "Activar",
    attack: "Atacar",
  },
  cn: {
    sSet: "后场放置",
    summon: "普通召唤",
    spSummon: "特殊召唤",
    posChange: "改变表示形式",
    mSet: "前场放置",
    activate: "发动效果",
    attack: "攻击",
  },
};

// Get the language from localStorage or default to 'cn' (I18N)
const language = (localStorage.getItem("language") || "cn") as Language;
/* End of definition (I18N) */

export function interactTypeToString(t: InteractType): string {
  const sSet = messages[language].sSet;
  const summon = messages[language].summon;
  const spSummon = messages[language].spSummon;
  const posChange = messages[language].posChange;
  const mSet = messages[language].mSet;
  const activate = messages[language].activate;
  const attack = messages[language].attack;

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
