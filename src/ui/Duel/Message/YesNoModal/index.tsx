import { Button } from "antd";
import React from "react";
import { proxy, useSnapshot } from "valtio";

import { sendSelectEffectYnResponse } from "@/api";
import { getUIContainer } from "@/container/compat";
import { matStore } from "@/stores";
import { DuelChoice } from "@/stores/duelChoice";

import { NeosModal } from "../NeosModal";

interface YesNoModalProps {
  isOpen: boolean;
  msg: string;
  confirmOnly: boolean;
  requestId: number;
}
const defaultProps = {
  isOpen: false,
  msg: "",
  confirmOnly: false,
  requestId: 0,
};

const localStore = proxy<YesNoModalProps>({ ...defaultProps });

export const YesNoModal: React.FC = () => {
  const { isOpen, msg, confirmOnly, requestId } = useSnapshot(localStore);
  const hint = useSnapshot(matStore.hint);

  const preHintMsg = hint?.esHint || "";
  const submit = (yes: boolean) => {
    // eslint-disable-next-line valtio/state-snapshot-rule -- 旧事件必须携带原请求编号。
    choice.submit(yes, requestId);
  };

  return (
    <NeosModal
      movable
      title={[preHintMsg, msg].filter(Boolean).join(" ")}
      open={isOpen}
      width={"25rem"}
      afterClose={() => {
        if (localStore.isOpen) return;
        localStore.msg = "";
        matStore.hint.esHint = undefined;
      }}
      footer={
        <>
          {!confirmOnly && (
            <Button data-testid="duel-yesno-no" onClick={() => submit(false)}>
              取消
            </Button>
          )}
          <Button
            data-testid="duel-yesno-yes"
            type="primary"
            onClick={() => submit(true)}
          >
            确认
          </Button>
        </>
      }
    >
      <div data-testid="duel-yesno-modal" />
    </NeosModal>
  );
};

const choice = new DuelChoice<boolean>(() => {
  localStore.isOpen = false;
  // 退出动画期间保留标题，动画结束后再清理消息。
});

export const displayYesNoModal = async (msg: string, confirmOnly = false) => {
  const conn = getUIContainer().conn;
  const request = choice.open({
    eligible: () => getUIContainer().conn === conn,
    respond: (yes) => confirmOnly || sendSelectEffectYnResponse(conn, yes),
  });
  if (!request) return false;
  localStore.msg = msg;
  localStore.confirmOnly = confirmOnly;
  localStore.requestId = request.id;
  localStore.isOpen = true;
  return (await request.result) ?? false;
};
