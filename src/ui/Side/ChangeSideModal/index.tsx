import { App, Button, Modal } from "antd";
import React, { useEffect } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useSnapshot } from "valtio";

import { CardMeta, sendUpdateDeck } from "@/api";
import { roomStore, SideStage, sideStore } from "@/stores";

import { DeckEditor } from "../../BuildDeck";
import { editDeckStore } from "../../BuildDeck/store";
import { iDeckToEditingDeck } from "../../BuildDeck/utils";
import { Background } from "../../Shared";

export const ChangeSideModal: React.FC = () => {
  const { message } = App.useApp();
  const { deckName, main, extra, side } = useSnapshot(editDeckStore);
  const { stage } = useSnapshot(sideStore);
  const { errorMsg } = useSnapshot(roomStore);

  const cardMeta2Id = (meta: CardMeta) => meta.id;
  const handleSummit = () => {
    const newDeck = {
      deckName: deckName,
      main: main.map(cardMeta2Id),
      extra: extra.map(cardMeta2Id),
      side: side.map(cardMeta2Id),
    };
    sendUpdateDeck(newDeck);
    editDeckStore.edited = false;
  };

  useEffect(() => {
    if (stage === SideStage.SIDE_CHANGED) {
      message.info("副卡组更换成功，请耐心等待其他玩家更换卡组");
    }
  }, [stage]);
  useEffect(() => {
    if (errorMsg !== undefined && errorMsg !== "") {
      message.error(errorMsg);
      roomStore.errorMsg = undefined;
    }
  }, [errorMsg]);

  return (
    <Modal
      title="请选择更换副卡组"
      open={
        stage === SideStage.SIDE_CHANGING || stage === SideStage.SIDE_CHANGED
      }
      width={700}
      closable={false}
      footer={
        <Button
          disabled={stage > SideStage.SIDE_CHANGING}
          onClick={handleSummit}
        >
          副卡组更换完毕
        </Button>
      }
    >
      <DndProvider backend={HTML5Backend}>
        <Background />
        <DeckEditor
          deck={sideStore.deck}
          onClear={() => message.error("对局中清空卡组不怕找不回来吗?!")}
          onSave={() => message.error("点击右下角按钮确认副卡组更换完毕")}
          onReset={async () => {
            editDeckStore.set(await iDeckToEditingDeck(sideStore.deck));
          }}
        />
      </DndProvider>
    </Modal>
  );
};
