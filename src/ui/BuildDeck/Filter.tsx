import { InfoCircleFilled } from "@ant-design/icons";
import {
  Button,
  InputNumber,
  type InputNumberProps,
  Select,
  Tooltip,
} from "antd";
import { useState } from "react";

import { fetchStrings, Region } from "@/api";
import {
  Attribute2StringCodeMap,
  Race2StringCodeMap,
  Type2StringCodeMap,
} from "@/common";
import { FtsConditions } from "@/middleware/sqlite/fts";

import styles from "./Filter.module.scss";

const levels = Array.from({ length: 12 }, (_, index) => ({
  value: index + 1,
  label: (index + 1).toString(),
}));

const lscales = Array.from({ length: 12 }, (_, index) => ({
  value: index + 1,
  label: (index + 1).toString(),
}));

export const Filter: React.FC<{
  conditions: FtsConditions;
  onConfirm: (newConditons: FtsConditions) => void;
  onCancel: () => void;
}> = ({ conditions, onConfirm, onCancel }) => {
  const [newConditions, setNewConditions] = useState<FtsConditions>(conditions);
  const handleSelectChange =
    <T extends keyof FtsConditions>(key: T) =>
    (value: FtsConditions[T]) => {
      setNewConditions((prev) => ({
        ...prev,
        [key]: value,
      }));
    };
  const genOptions = (map: Map<number, number>) =>
    Array.from(map.entries()).map(([key, value]) => ({
      value: key,
      label: fetchStrings(Region.System, value),
    }));
  const T = [
    [genOptions(Attribute2StringCodeMap), "属性", "attributes"],
    [genOptions(Race2StringCodeMap), "种族", "races"],
    [genOptions(Type2StringCodeMap), "类型", "types"],
    [levels, "星级", "levels"],
    [lscales, "灵摆刻度", "lscales"],
  ] as const;

  const handleInputNumberChange =
    (attibute: "atk" | "def", index: "min" | "max") => (value: any) => {
      setNewConditions((prev) => ({
        ...prev,
        [attibute]: {
          ...prev[attibute],
          [index]: value,
        },
      }));
    };

  return (
    <>
      <div className={styles.title}>卡片筛选</div>
      <div className={styles.form}>
        {T.map(([options, title, key]) => (
          <Item title={title} key={key}>
            <CustomSelect
              options={options}
              defaultValue={conditions[key]}
              onChange={handleSelectChange(key)}
            />
          </Item>
        ))}
        <Item title="攻击力" showTip>
          <div className={styles.number}>
            <CustomInputNumber
              placeholder="最小值"
              onChange={handleInputNumberChange("atk", "min")}
              value={newConditions.atk.min}
            />
            <span className={styles.divider}>~</span>
            <CustomInputNumber
              placeholder="最大值"
              onChange={handleInputNumberChange("atk", "max")}
              value={newConditions.atk.max}
            />
          </div>
        </Item>
        <Item title="守备力" showTip>
          <div className={styles.number}>
            <CustomInputNumber
              placeholder="最小值"
              onChange={handleInputNumberChange("def", "min")}
              value={newConditions.def.min}
            />
            <span className={styles.divider}>~</span>
            <CustomInputNumber
              placeholder="最大值"
              onChange={handleInputNumberChange("def", "max")}
              value={newConditions.def.max}
            />
          </div>
        </Item>
      </div>
      <div className={styles.btns}>
        <Button
          type="primary"
          onClick={() => {
            onConfirm(newConditions);
            console.log(newConditions);
          }}
        >
          确定
        </Button>
        <Button type="text" onClick={onCancel}>
          取&nbsp;消
        </Button>
      </div>
    </>
  );
};

/** 只支持输入整数 */
const CustomInputNumber = (props: InputNumberProps) => (
  <InputNumber
    {...props}
    formatter={(value) => (value !== undefined ? String(value) : "")}
    parser={(value = "") => {
      const parsedValue = value.replace(/[^\d-]/g, ""); // 允许数字和负号
      if (parsedValue === "-") return "-"; // 单独的负号允许通过
      return parsedValue;
    }}
    min={-2}
    max={1000000}
    step={100}
  />
);

const CustomSelect: React.FC<{
  options: {
    label: string;
    value: number;
  }[];
  defaultValue: number[];
  onChange: (values: number[]) => void;
}> = ({ options, defaultValue, onChange }) => {
  return (
    <Select
      mode="multiple"
      allowClear
      style={{ width: "100%" }}
      placeholder="请选择"
      options={options}
      defaultValue={defaultValue}
      onChange={onChange}
    />
  );
};

const Item: React.FC<
  React.PropsWithChildren<{ title: string; showTip?: boolean }>
> = ({ title, children, showTip = false }) => (
  <div className={styles.item}>
    <div className={styles["item-name"]}>
      {title}
      {showTip && (
        <Tooltip title="若要输入 ? 的攻击/守备，请输入 -2">
          <InfoCircleFilled style={{ fontSize: "0.625rem" }} />
        </Tooltip>
      )}
    </div>
    {children}
  </div>
);
