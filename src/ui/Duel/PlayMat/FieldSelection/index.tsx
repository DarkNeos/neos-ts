import { Button } from "antd";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useSnapshot } from "valtio";

import { duelSelection } from "@/stores/duelSelection";
import {
  cancelFieldSelection,
  fieldSelection,
  finishFieldSelection,
  getFieldSelectionOptions,
  submitFieldSelection,
} from "@/stores/fieldSelection";

import styles from "./index.module.scss";

export const FieldSelection = () => {
  const field = useSnapshot(fieldSelection);
  const state = useSnapshot(duelSelection.state);
  const { t: i18n } = useTranslation("Menu");
  const options = field.active ? getFieldSelectionOptions() : undefined;
  if (!options) return null;
  const incremental = options.single;
  const cancelable = options.cancelable && !(incremental && options.finishable);
  const progress = incremental
    ? `${options.selectables.filter((option) => option.selected).length} 张`
    : options.selectionKind === "tribute"
    ? `${state.selected.reduce(
        (sum, i) => sum + (options.selectables[i].tributeValue ?? 1),
        0,
      )} / ${options.min}`
    : options.selectionKind === "sum"
    ? `${state.selected.length + options.mustSelects.length} 张 · ${
        options.totalLevels
      }${options.overflow ? "+" : ""}`
    : `${state.selected.length} / ${
        options.min === options.max
          ? options.max
          : `${options.min}–${options.max}`
      }`;
  return createPortal(
    <div
      className={styles.bar}
      data-testid="field-selection"
      role="region"
      aria-label="场上选卡"
    >
      <span>{field.hint}</span>
      <span data-testid="field-selection-progress">{progress}</span>
      {cancelable && (
        <Button
          data-testid="field-selection-cancel"
          onClick={cancelFieldSelection}
        >
          取消
        </Button>
      )}
      {(!incremental || options.finishable) && (
        <Button
          data-testid="field-selection-submit"
          type="primary"
          disabled={!incremental && !state.valid}
          onClick={incremental ? finishFieldSelection : submitFieldSelection}
        >
          {incremental ? i18n("SelectionComplete") : "确认"}
        </Button>
      )}
    </div>,
    document.body,
  );
};
