import { App, Button, Modal, Space, Tag } from "antd";
import { proxy, useSnapshot } from "valtio";

import { deckStore, replayStore } from "@/stores";
import { downloadDeckAsYDK } from "@/ui/BuildDeck/utils";

const state = proxy({ open: false });
export const openReplayDecks = () => {
  state.open = true;
};

export const ReplayDecks = () => {
  const { open } = useSnapshot(state);
  const { decks, deckError } = useSnapshot(replayStore);
  const { message } = App.useApp();
  return (
    <Modal
      title="提取录像卡组"
      open={open}
      onCancel={() => {
        state.open = false;
      }}
      footer={null}
      width={600}
      centered
    >
      <p>
        从录像内保存的服务器数据提取双方主卡组和额外卡组，可导出 YDK
        或保存到本地卡组。服务器录像不包含副卡组。
      </p>
      {deckError && <p role="alert">{deckError}</p>}
      {!decks.length && (
        <p>
          这份录像未保存服务器完整卡组数据，无法提取。旧版 NEOS
          录像需要重新获取服务器原始录像。
        </p>
      )}
      {decks.map((deck, index) => (
        <div
          key={index}
          data-testid="replay-extracted-deck"
          style={{ padding: "12px 0", borderTop: "1px solid #ffffff26" }}
        >
          <strong>
            第 {deck.game} 局 · {deck.player}
          </strong>{" "}
          <Tag color={deck.complete ? "green" : "orange"}>
            {deck.complete ? "主卡组和额外卡组完整" : "服务器卡组数据不完整"}
          </Tag>
          <p>
            主卡组 {deck.main.length} / {deck.expectedMain} · 额外卡组{" "}
            {deck.extra.length} / {deck.expectedExtra}
          </p>
          <Space wrap>
            <Button
              disabled={
                !deck.complete || (!deck.main.length && !deck.extra.length)
              }
              onClick={() => downloadDeckAsYDK(replayStore.decks[index])}
            >
              导出 YDK
            </Button>
            <Button
              disabled={
                !deck.complete || (!deck.main.length && !deck.extra.length)
              }
              onClick={async () => {
                const source = replayStore.decks[index];
                let name = source.deckName;
                for (let suffix = 2; deckStore.get(name); suffix++)
                  name = `${source.deckName} (${suffix})`;
                const saved = await deckStore.add({
                  ...source,
                  main: [...source.main],
                  extra: [...source.extra],
                  side: [],
                  deckName: name,
                });
                if (saved) message.success(`已保存：${name}`);
                else message.error("卡组保存失败，请重试");
              }}
            >
              保存到本地卡组
            </Button>
          </Space>
        </div>
      ))}
    </Modal>
  );
};
