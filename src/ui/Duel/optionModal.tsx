import React, { useState } from "react";
import { useAppSelector } from "@/hook";
import { store } from "@/store";
import { Button } from "antd";
import { CheckCard } from "@ant-design/pro-components";
import {
  selectOptionModalIsOpen,
  selectOptionModalOptions,
} from "@/reducers/duel/modal/mod";
import { sendSelectOptionResponse } from "@/api/ocgcore/ocgHelper";
import { resetOptionModal, setOptionModalIsOpen } from "@/reducers/duel/mod";
import DragModal from "./dragModal";

const OptionModal = () => {
  const dispatch = store.dispatch;
  const isOpen = useAppSelector(selectOptionModalIsOpen);
  const options = useAppSelector(selectOptionModalOptions);
  const [selected, setSelected] = useState<number | undefined>(undefined);

  return (
    <DragModal
      title="请选择需要发动的效果"
      open={isOpen}
      closable={false}
      footer={
        <Button
          disabled={selected === undefined}
          onClick={() => {
            if (selected !== undefined) {
              sendSelectOptionResponse(selected);
              dispatch(setOptionModalIsOpen(false));
              dispatch(resetOptionModal());
            }
          }}
        >
          submit
        </Button>
      }
    >
      <CheckCard.Group
        bordered
        size="small"
        onChange={(value) => {
          // @ts-ignore
          setSelected(value);
        }}
      >
        {options.map((option, idx) => (
          <CheckCard key={idx} title={option.msg} value={option.response} />
        ))}
      </CheckCard.Group>
    </DragModal>
  );
};

export default OptionModal;
