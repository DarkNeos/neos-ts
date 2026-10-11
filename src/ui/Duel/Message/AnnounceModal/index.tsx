import { SearchOutlined } from "@ant-design/icons";
import { Avatar, Button, Checkbox, Input, List } from "antd";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { proxy, useSnapshot } from "valtio";

import {
  CardMeta,
  getCardImgUrl,
  searchCards,
  sendSelectOptionResponse,
} from "@/api";
import { quoteCardName } from "@/api/cardText";
import { isDeclarable, isToken } from "@/common";
import { getUIContainer } from "@/container/compat";
import { emptySearchConditions } from "@/middleware/sqlite/fts";
import { DuelChoice } from "@/stores/duelChoice";
import { ScrollableArea } from "@/ui/Shared";

import { NeosModal } from "../NeosModal";
import styles from "./index.module.scss";

const MAX_DESC_LEN = 20;

interface Props {
  isOpen: boolean;
  opcodes: number[];
  requestId: number;
}

const defaultProps = {
  isOpen: false,
  opcodes: [],
  requestId: 0,
};

const store = proxy<Props>({ ...defaultProps });

export const AnnounceModal: React.FC = () => {
  const { isOpen, requestId } = useSnapshot(store);
  const [searchWord, setSearchWord] = useState("");
  const [namesOnly, setNamesOnly] = useState(false);
  const { t } = useTranslation("BuildDeck");
  const [cardList, setCardList] = useState<CardMeta[]>([]);
  const [selected, setSelected] = useState<number | undefined>(undefined);

  const handleSearch = () => {
    const result = searchCards({
      query: searchWord,
      conditions: emptySearchConditions,
      namesOnly,
    }).filter(
      (card) =>
        isDeclarable(card, store.opcodes) && !isToken(card.data.type ?? 0),
    );

    // 清掉之前选中的记录
    setSelected(undefined);
    setCardList(result);
  };
  const onSummit = () => {
    if (selected !== undefined) {
      // 宣言响应使用卡号，搜索结果中的列表位置不参与协议响应。
      // eslint-disable-next-line valtio/state-snapshot-rule -- 旧事件必须携带原请求编号。
      choice.submit(selected, requestId);
    }
  };
  useEffect(() => {
    setSearchWord("");
    setCardList([]);
    setSelected(undefined);
  }, [requestId]);
  useEffect(() => {
    // 搜索范围改变时重查当前宣言列表，并清除不再可靠的旧选择。
    if (store.isOpen) handleSearch();
  }, [namesOnly]);

  return (
    <NeosModal
      movable
      title="请输入关键字并选择宣言的卡"
      open={isOpen}
      footer={
        <Button
          data-testid="duel-announce-submit"
          disabled={selected === undefined}
          onClick={onSummit}
        >
          确定
        </Button>
      }
    >
      <div className={styles.container} data-testid="duel-announce-modal">
        <Input
          className={styles.input}
          data-testid="duel-announce-search"
          placeholder="请输入宣言卡名(或关键字)"
          variant="borderless"
          value={searchWord}
          onChange={(e) => setSearchWord(e.target.value)}
          suffix={
            <Button
              data-testid="duel-announce-search-submit"
              type="text"
              icon={<SearchOutlined />}
              onClick={() => handleSearch()}
            />
          }
          onKeyUp={(e) => e.key === "Enter" && handleSearch()}
          allowClear
        />
        <Checkbox
          data-testid="duel-announce-name-only"
          checked={namesOnly}
          onChange={(event) => setNamesOnly(event.target.checked)}
        >
          {t("SearchNameOnly")}
        </Checkbox>
        <ScrollableArea maxHeight="50vh">
          <List
            dataSource={cardList}
            renderItem={(item, index) => (
              <List.Item
                key={index}
                data-testid="duel-announce-card-option"
                data-card-code={item.id}
                actions={[
                  <Checkbox
                    checked={item.id === selected}
                    onClick={() => {
                      if (item.id === selected) {
                        // 之前选的就是这个，则取消选中
                        setSelected(undefined);
                      } else {
                        // 选中
                        setSelected(item.id);
                      }
                    }}
                  />,
                ]}
              >
                <List.Item.Meta
                  avatar={<Avatar src={getCardImgUrl(item.id)} />}
                  title={<a>{quoteCardName(item.text.name)}</a>}
                  description={
                    item.text.desc?.substring(0, MAX_DESC_LEN) + "..."
                  }
                />
              </List.Item>
            )}
          />
        </ScrollableArea>
      </div>
    </NeosModal>
  );
};

const choice = new DuelChoice<number>(() => {
  store.isOpen = false;
  store.opcodes = [];
});

export const displayAnnounceModal = async (opcodes: number[]) => {
  const conn = getUIContainer().conn;
  const request = choice.open({
    eligible: () => getUIContainer().conn === conn,
    validate: (code) => Number.isInteger(code) && code > 0,
    respond: (code) => sendSelectOptionResponse(conn, code),
  });
  if (!request) return;
  store.opcodes = opcodes;
  store.requestId = request.id;
  store.isOpen = true;
  await request.result;
};
