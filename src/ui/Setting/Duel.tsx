import { Checkbox, Form, Select } from "antd";
import { useSnapshot } from "valtio";

import { ChainSetting } from "@/stores/matStore/types";
import { settingStore } from "@/stores/settingStore";

export const DuelSetting = () => {
  const { duel } = useSnapshot(settingStore);
  return (
    <Form layout="vertical">
      <Form.Item
        label="入场连锁模式"
        extra="进入每一局对战时生效，对战中仍可临时切换。"
      >
        <Select
          aria-label="入场连锁模式"
          data-testid="initial-chain-setting"
          value={duel.initialChain}
          onChange={(initialChain) =>
            settingStore.saveDuelConfig({ initialChain })
          }
          options={[
            {
              value: ChainSetting.CHAIN_SMART,
              label: "智能连锁：询问关键时点",
            },
            { value: ChainSetting.CHAIN_ALL, label: "全部连锁：询问全部时点" },
            {
              value: ChainSetting.CHAIN_AVAILABLE,
              label: "可用连锁：有可发动效果时询问",
            },
            {
              value: ChainSetting.CHAIN_IGNORE,
              label: "不连锁：跳过可选连锁询问",
            },
          ]}
        />
      </Form.Item>
      <Checkbox
        checked={duel.fieldArtwork}
        onChange={(event) =>
          settingStore.saveDuelConfig({ fieldArtwork: event.target.checked })
        }
      >
        显示场地立绘
      </Checkbox>
    </Form>
  );
};
