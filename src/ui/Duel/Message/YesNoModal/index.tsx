import { Button } from "antd";
import React from "react";
import { proxy, useSnapshot } from "valtio";

import { sendSelectEffectYnResponse } from "@/api";
import { matStore } from "@/stores";

import { NeosModal } from "../NeosModal";

interface YesNoModalProps {
  isOpen: boolean;
  msg?: string;
}
const defaultProps = { isOpen: false };

const localStore = proxy<YesNoModalProps>(defaultProps);

export const YesNoModal: React.FC = () => {
  const { isOpen, msg } = useSnapshot(localStore);
  const hint = useSnapshot(matStore.hint);

  const preHintMsg = hint?.esHint || "";

  return (
    <NeosModal
      title={`${preHintMsg} ${msg}`}
      open={isOpen}
      width={"25rem"}
      afterClose={() => (matStore.hint.esHint = undefined)}
      footer={
        <>
          <Button
            onClick={() => {
              sendSelectEffectYnResponse(false);
              rs();
            }}
          >
            取消
          </Button>
          <Button
            type="primary"
            onClick={() => {
              sendSelectEffectYnResponse(true);
              rs();
            }}
          >
            确认
          </Button>
        </>
      }
    />
  );
};

let rs: (arg?: any) => void = () => {};

export const displayYesNoModal = async (msg: string) => {
  localStore.msg = msg;
  localStore.isOpen = true;
  await new Promise<void>((resolve) => (rs = resolve)); // 等待在组件内resolve
  localStore.isOpen = false;
};
