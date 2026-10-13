import { CloudOutlined, ReloadOutlined } from "@ant-design/icons";
import { App, Button } from "antd";
import type { CSSProperties } from "react";
import { useSnapshot } from "valtio";

import { deckLibraryStore } from "@/stores/deckLibraryStore";

import { Select } from "./Select";

export const DeckLibraryPicker = ({
  title,
  testId,
  disabled,
  style,
  onSelected,
}: {
  title: string;
  testId: string;
  disabled?: boolean;
  style?: CSSProperties;
  onSelected?: () => void;
}) => {
  const snap = useSnapshot(deckLibraryStore);
  const { message } = App.useApp();
  return (
    <Select
      title={title}
      data-testid={testId}
      showSearch={false}
      style={style}
      value={snap.selectedEntry?.id ?? (snap.selectedId || undefined)}
      disabled={disabled}
      loading={snap.loading || snap.restoring || !!snap.selectingId}
      placeholder="选择卡组"
      options={(["cloud", "local"] as const).map((source) => ({
        label: source === "cloud" ? "我的云卡组" : "本地卡组",
        options: snap.entries
          .filter((entry) => entry.source === source)
          .map((entry) => ({
            value: entry.id,
            label: `${snap.pinned.includes(entry.id) ? "★ " : ""}${
              entry.deckName
            }`,
          })),
      }))}
      onChange={async (id) => {
        try {
          const deck = await deckLibraryStore.select(String(id));
          if (deck) onSelected?.();
        } catch (error) {
          message.error(
            error instanceof Error ? error.message : "加载卡组失败，请重试",
          );
        }
      }}
      dropdownRender={(menu) => (
        <>
          {menu}
          {snap.accountId !== undefined && (
            <div
              style={{
                padding: "6px 10px",
                borderTop: "1px solid #ffffff22",
                maxWidth: 280,
              }}
            >
              <small>
                <CloudOutlined />{" "}
                {snap.error
                  ? `${snap.error}，已缓存的卡组仍可使用`
                  : "云卡组可直接用于对战"}
              </small>
              <Button
                type="text"
                size="small"
                icon={<ReloadOutlined />}
                aria-label="刷新云卡组"
                loading={snap.loading}
                onClick={() => void deckLibraryStore.refresh()}
              >
                刷新
              </Button>
            </div>
          )}
        </>
      )}
    />
  );
};
