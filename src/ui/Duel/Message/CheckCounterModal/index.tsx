// 指示器选择弹窗
import { Omit } from "@react-spring/web";
import { Button, InputNumber } from "antd";
import React, { useEffect, useState } from "react";
import { proxy, useSnapshot } from "valtio";

import { fetchStrings, Region, sendSelectCounterResponse } from "@/api";
import { YgoCard } from "@/ui/Shared";

import { NeosModal } from "../NeosModal";
import styles from "./index.module.scss";

interface CheckCounterModalProps {
  isOpen: boolean;
  counterType?: number;
  min?: number;
  options: {
    code: number;
    max: number;
  }[];
}
const defaultProps = {
  isOpen: false,
  options: [],
};

const localStore = proxy<CheckCounterModalProps>(defaultProps);

export const CheckCounterModal = () => {
  const snapCheckCounterModal = useSnapshot(localStore);

  const isOpen = snapCheckCounterModal.isOpen;
  const min = snapCheckCounterModal.min || 0;
  const options = snapCheckCounterModal.options;
  const counterName = fetchStrings(
    Region.Counter,
    `0x${snapCheckCounterModal.counterType?.toString(16)}`,
  );

  const [selected, setSelected] = useState(new Array(options.length));
  const sum = selected.reduce((sum, current) => sum + current, 0);
  const finishable = sum === min;

  useEffect(() => {
    setSelected(new Array(options.length));
  }, [options]);

  const onFinish = () => {
    sendSelectCounterResponse(selected);
    rs();
  };

  return (
    <NeosModal
      title={`请移除${min}个${counterName}`}
      open={isOpen}
      footer={
        <Button disabled={!finishable} onClick={onFinish}>
          finish
        </Button>
      }
    >
      <div className={styles.container}>
        {options.map((option, idx) => {
          return (
            <div key={idx}>
              <YgoCard code={option.code} className={styles.card} />
              <InputNumber
                className={styles["input-number"]}
                min={0}
                max={option.max}
                defaultValue={0}
                onChange={(value) => {
                  setSelected((prevSelected) => {
                    let newSelected = [...prevSelected];
                    newSelected[idx] = value ?? 0;
                    return newSelected;
                  });
                }}
              />
            </div>
          );
        })}
      </div>
    </NeosModal>
  );
};

let rs: (arg?: any) => void = () => {};

export const displayCheckCounterModal = async (
  args: Omit<CheckCounterModalProps, "isOpen">,
) => {
  Object.entries(args).forEach(([key, value]) => {
    // @ts-ignore
    localStore[key] = value;
  });
  localStore.isOpen = true;
  await new Promise<void>((resolve) => (rs = resolve)); // 等待在组件内resolve
  localStore.isOpen = false;
  localStore.options = [];
  localStore.min = undefined;
  localStore.counterType = undefined;
};
