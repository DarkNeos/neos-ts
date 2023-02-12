import React from "react";
import { sendHandResult, sendTpResult } from "../api/ocgcore/ocgHelper";
import { useAppSelector } from "../hook";
import {
  selectHandSelectAble,
  unSelectHandAble,
  selectTpSelectAble,
  unSelectTpAble,
} from "../reducers/moraSlice";
import { selectDuelHsStart } from "../reducers/duel/mod";
import { store } from "../store";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Modal } from "antd";

const Mora = () => {
  const dispatch = store.dispatch;
  const selectHandAble = useAppSelector(selectHandSelectAble);
  const selectTpAble = useAppSelector(selectTpSelectAble);
  const duelHsStart = useAppSelector(selectDuelHsStart);
  const navigate = useNavigate();

  useEffect(() => {
    // 若对局已经开始，自动跳转
    if (duelHsStart) {
      navigate("/duel");
    }
  }, [duelHsStart]);

  const handleSelectMora = (selected: string) => {
    sendHandResult(selected);
    dispatch(unSelectHandAble());
  };
  const handleSelectTp = (isFirst: boolean) => {
    sendTpResult(isFirst);
    dispatch(unSelectTpAble());
  };

  return (
    <>
      <Modal open={selectHandAble} footer={<></>}>
        <Button
          disabled={!selectHandAble}
          onClick={() => {
            handleSelectMora("scissors");
          }}
        >
          剪刀
        </Button>
        <Button
          disabled={!selectHandAble}
          onClick={() => {
            handleSelectMora("rock");
          }}
        >
          石头
        </Button>
        <Button
          disabled={!selectHandAble}
          onClick={() => {
            handleSelectMora("paper");
          }}
        >
          布
        </Button>
      </Modal>
      <Modal open={!selectHandAble && selectTpAble} footer={<></>}>
        <Button
          disabled={!selectTpAble}
          onClick={() => {
            handleSelectTp(true);
          }}
        >
          先攻
        </Button>
        <Button
          disabled={!selectTpAble}
          onClick={() => {
            handleSelectTp(false);
          }}
        >
          后攻
        </Button>
      </Modal>
    </>
  );
};

export default Mora;
