import type { CardMeta, ygopro } from "@/api";

import type { CardType } from "./cardStore";
import type { SelectionRules } from "./selectionRules";

/** 候选身份由协议序号与位置确定，不能使用卡号区分同名卡。 */
export interface CardSelectionOption {
  meta: CardMeta;
  location?: ygopro.CardLocation;
  effectDesc?: string;
  tributeValue?: number;
  level1?: number;
  level2?: number;
  /** 协议中的候选响应值；界面分组后仍用该值，不能按展示顺序重新编号。 */
  response?: number;
  /** 服务器已确认的累计选择，与玩家本次勾选和必选卡分别管理。 */
  selected?: boolean;
  targeted?: boolean;
  disabled?: boolean;
  card?: CardType;
}

export interface CardSelectionRequest<T> extends SelectionRules {
  selectables: readonly T[];
  /** 最终响应必须包含这些卡片，合计手续的张数限制不包含它们。 */
  mustSelects: readonly T[];
  /** 单独展示的已选卡；逐张选择中可取消的已选卡应放入 selectables。 */
  selecteds?: readonly T[];
  cancelable: boolean;
  finishable?: boolean;
  isChain?: boolean;
}
