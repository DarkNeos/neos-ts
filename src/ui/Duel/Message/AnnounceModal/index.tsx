import { SearchOutlined } from "@ant-design/icons";
import { Avatar, Button, Checkbox, Input, List } from "antd";
import React, { useState } from "react";
import { proxy, useSnapshot } from "valtio";

import { CardMeta, searchCards, sendSelectOptionResponse } from "@/api";
import { isDeclarable, isToken } from "@/common";
import { emptySearchConditions } from "@/middleware/sqlite/fts";
import { getCardImgUrl } from "@/ui/Shared";

import { NeosModal } from "../NeosModal";
import styles from "./index.module.scss";

const MAX_DESC_LEN = 20;
const PAGE_SIZE = 5;

interface Props {
  isOpen: boolean;
  opcodes: number[];
}

const defaultProps = {
  isOpen: false,
  opcodes: [],
};

const store = proxy<Props>(defaultProps);

export const AnnounceModal: React.FC = () => {
  const { isOpen } = useSnapshot(store);
  const [searchWord, setSearchWord] = useState("");
  const [cardList, setCardList] = useState<CardMeta[]>([]);
  const [selected, setSelected] = useState<number | undefined>(undefined);

  const handleSearch = () => {
    const result = searchCards({
      query: searchWord,
      conditions: emptySearchConditions,
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
      sendSelectOptionResponse(selected);
      rs();
      setSearchWord("");
      setCardList([]);
    }
  };

  return (
    <NeosModal
      title="请输入关键字并选择宣言的卡"
      open={isOpen}
      footer={
        <Button disabled={selected === undefined} onClick={onSummit}>
          确定
        </Button>
      }
    >
      <div className={styles.container}>
        <Input
          className={styles.input}
          placeholder="请输入宣言卡名(或关键字)"
          bordered={false}
          value={searchWord}
          onChange={(e) => setSearchWord(e.target.value)}
          suffix={
            <Button
              type="text"
              icon={<SearchOutlined />}
              onClick={() => handleSearch()}
            />
          }
          onKeyUp={(e) => e.key === "Enter" && handleSearch()}
          allowClear
        />
        <List
          pagination={{
            position: "bottom",
            align: "center",
            pageSize: PAGE_SIZE,
          }}
          dataSource={cardList}
          renderItem={(item, index) => (
            <List.Item
              key={index}
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
                title={<a>{item.text.name}</a>}
                description={item.text.desc?.substring(0, MAX_DESC_LEN) + "..."}
              />
            </List.Item>
          )}
        />
      </div>
    </NeosModal>
  );
};

let rs: (v?: any) => void = () => {};

export const displayAnnounceModal = async (opcodes: number[]) => {
  store.opcodes = opcodes;
  store.isOpen = true;
  await new Promise((resolve) => (rs = resolve));
  store.isOpen = false;
  store.opcodes = [];
};
