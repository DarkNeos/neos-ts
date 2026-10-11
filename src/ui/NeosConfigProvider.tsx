import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import { Provider as MotionProvider } from "rc-motion";
import type { PropsWithChildren } from "react";
import { useSnapshot } from "valtio";

import { settingStore } from "@/stores/settingStore";

import { theme } from "./theme";

export const NeosConfigProvider = ({ children }: PropsWithChildren) => {
  const { enabled } = useSnapshot(settingStore.animation);
  return (
    <ConfigProvider theme={theme} locale={zhCN} wave={{ disabled: !enabled }}>
      <MotionProvider motion={enabled}>{children}</MotionProvider>
    </ConfigProvider>
  );
};
