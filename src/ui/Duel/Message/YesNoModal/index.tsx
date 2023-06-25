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
      footer={
        <>
          <Button
            onClick={() => {
              sendSelectEffectYnResponse(true);
              rs();
            }}
          >
            Yes
          </Button>
          <Button
            onClick={() => {
              sendSelectEffectYnResponse(false);
              rs();
            }}
          >
            No
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
