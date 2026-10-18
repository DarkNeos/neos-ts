import { Button } from "antd";
import React from "react";
import { proxy, useSnapshot } from "valtio";

import { sendSelectEffectYnResponse } from "@/api";
import { getUIContainer } from "@/container/compat";
import { matStore } from "@/stores";
import { DuelChoice } from "@/stores/duelChoice";
import { YgoCard } from "@/ui/Shared";

import { NeosModal } from "../NeosModal";
import styles from "./index.module.scss";

interface YesNoModalProps {
  isOpen: boolean;
  msg: string;
  code: number;
  confirmOnly: boolean;
  requestId: number;
}
const defaultProps = {
  isOpen: false,
  msg: "",
  code: 0,
  confirmOnly: false,
  requestId: 0,
};

const localStore = proxy<YesNoModalProps>({ ...defaultProps });

export const YesNoModal: React.FC = () => {
  const { isOpen, msg, code, confirmOnly, requestId } = useSnapshot(localStore);
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
      onRightClickCancel={confirmOnly ? undefined : () => submit(false)}
      width={"25rem"}
      afterClose={() => {
        if (localStore.isOpen) return;
        localStore.msg = "";
        localStore.code = 0;
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
      <div data-testid="duel-yesno-modal">
        {code > 0 && (
          <div
            className={styles.card}
            data-testid="duel-yesno-card"
            data-card-code={code}
          >
            <YgoCard code={code} />
          </div>
        )}
      </div>
    </NeosModal>
  );
};

const choice = new DuelChoice<boolean>(() => {
  localStore.isOpen = false;
  // 退出动画期间保留标题，动画结束后再清理消息。
});

export const displayYesNoModal = async (
  msg: string,
  confirmOnly = false,
  code = 0,
) => {
  const conn = getUIContainer().conn;
  const request = choice.open({
    eligible: () => getUIContainer().conn === conn,
    respond: (yes) => confirmOnly || sendSelectEffectYnResponse(conn, yes),
  });
  if (!request) return false;
  localStore.msg = msg;
  localStore.code = code;
  localStore.confirmOnly = confirmOnly;
  localStore.requestId = request.id;
  localStore.isOpen = true;
  return (await request.result) ?? false;
};
