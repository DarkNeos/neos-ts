import "./index.scss";

import React from "react";
import { proxy, useSnapshot } from "valtio";

import { fetchStrings } from "@/api";
import { replayStore } from "@/stores";

import { NeosModal } from "../NeosModal";

interface EndProps {
  isOpen: boolean;
  isWin: boolean;
  reason?: string;
}

const defaultProps: EndProps = {
  isOpen: false,
  isWin: false,
};

const localStore = proxy(defaultProps);

export const EndModal: React.FC = () => {
  const { isOpen, isWin, reason } = useSnapshot(localStore);

  return (
    <NeosModal
      title={fetchStrings("!system", 1500)}
      open={isOpen}
      onOk={() => {
        const replayBuffers = replayStore.encode();
        const blob = new Blob(replayBuffers, {
          type: "application/octet-stream",
        });
        // download the replay file
        window.open(URL.createObjectURL(blob));
        rs();
      }}
      onCancel={() => {
        // TODO: reset all stores, and navigate to home
        rs();
      }}
    >
      <p>{isWin ? "Win" : "Defeated"}</p>
      <p>{reason}</p>
      <p>{fetchStrings("!system", 1340)}</p>
    </NeosModal>
  );
};

let rs: (arg?: any) => void = () => {};

export const displayEndModal = async (isWin: boolean, reason?: string) => {
  localStore.isWin = isWin;
  localStore.reason = reason;
  localStore.isOpen = true;
  await new Promise<void>((resolve) => (rs = resolve)); // 等待在组件内resolve
  localStore.isOpen = false;
  localStore.isWin = false;
  localStore.reason = undefined;
};
