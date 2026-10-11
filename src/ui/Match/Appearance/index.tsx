import { Button, Input, Modal } from "antd";
import { useMemo, useState } from "react";
import { useSnapshot } from "valtio";

import {
  appearanceStore,
  sleeveCatalog,
  type SleeveSlot,
  sleeveUrl,
} from "@/stores/appearanceStore";

import styles from "./index.module.scss";

const slots: { value: SleeveSlot; label: string }[] = [
  { value: "meMain", label: "我方主卡组" },
  { value: "meExtra", label: "我方额外卡组" },
  { value: "opMain", label: "对方主卡组" },
  { value: "opExtra", label: "对方额外卡组" },
];

export const Appearance = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const selected = useSnapshot(appearanceStore);
  const [slot, setSlot] = useState<SleeveSlot>("meMain");
  const [query, setQuery] = useState("");
  const options = useMemo(
    () =>
      sleeveCatalog.filter((sleeve) =>
        `${sleeve.name} ${sleeve.id}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
      ),
    [query],
  );
  return (
    <Modal
      title="外观 · 卡套"
      open={open}
      onCancel={onClose}
      footer={<Button onClick={onClose}>完成</Button>}
      width={820}
      centered
      bodyStyle={{ maxHeight: "calc(100dvh - 150px)", overflowY: "auto" }}
    >
      <p>
        分别设置双方主卡组与额外卡组的卡套，选择后自动保存，仅影响本机显示。
      </p>
      <div className={styles.previews}>
        {slots.map(({ value, label }) => (
          <button
            type="button"
            key={value}
            onClick={() => setSlot(value)}
            data-selected={slot === value}
            data-testid={`sleeve-slot-${value}`}
          >
            <img src={sleeveUrl(selected[value])} alt={label} />
            <span>{label}</span>
          </button>
        ))}
      </div>
      <Input.Search
        aria-label="搜索卡套"
        placeholder="搜索卡套名称或编号"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        allowClear
      />
      <p className={styles.count}>
        {options.length} 款卡套 · 当前设置：
        {slots.find((item) => item.value === slot)?.label}
      </p>
      <div className={styles.catalog} role="group" aria-label="卡套图案">
        {options.map((sleeve) => (
          <button
            type="button"
            key={sleeve.id}
            data-testid="sleeve-option"
            data-sleeve-id={sleeve.id}
            aria-pressed={selected[slot] === sleeve.id}
            onClick={() => {
              appearanceStore[slot] = sleeve.id;
            }}
          >
            <img src={sleeveUrl(sleeve.id)} alt={sleeve.name} loading="lazy" />
            <span>{sleeve.name}</span>
          </button>
        ))}
      </div>
    </Modal>
  );
};
