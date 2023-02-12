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
import { useNavigate, useParams } from "react-router-dom";
import { Button, Modal } from "antd";
import {
  ScissorOutlined,
  SketchOutlined,
  TableOutlined,
} from "@ant-design/icons";

const Mora = () => {
  const dispatch = store.dispatch;
  const selectHandAble = useAppSelector(selectHandSelectAble);
  const selectTpAble = useAppSelector(selectTpSelectAble);
  const duelHsStart = useAppSelector(selectDuelHsStart);
  const navigate = useNavigate();
  const { player, passWd, ip } = useParams<{
    player?: string;
    passWd?: string;
    ip?: string;
  }>();

  useEffect(() => {
    // 若对局已经开始，自动跳转
    if (duelHsStart) {
      navigate(`/duel/${player}/${passWd}/${ip}`);
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
      <Modal title="请选择猜拳" open={selectHandAble} footer={<></>}>
        <Button
          disabled={!selectHandAble}
          onClick={() => {
            handleSelectMora("scissors");
          }}
          icon={<ScissorOutlined />}
        >
          剪刀
        </Button>
        <Button
          disabled={!selectHandAble}
          onClick={() => {
            handleSelectMora("rock");
          }}
          icon={<SketchOutlined />}
        >
          石头
        </Button>
        <Button
          disabled={!selectHandAble}
          onClick={() => {
            handleSelectMora("paper");
          }}
          icon={<TableOutlined />}
        >
          布
        </Button>
      </Modal>
      <Modal
        title="请选择先攻/后攻"
        open={!selectHandAble && selectTpAble}
        footer={<></>}
      >
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
