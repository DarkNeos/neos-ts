import {
  ScissorOutlined,
  SketchOutlined,
  TableOutlined,
} from "@ant-design/icons";
import { Button, Modal } from "antd";
import React, { useContext, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { sendHandResult, sendTpResult } from "@/api/ocgcore/ocgHelper";
import { useConfig } from "@/config";
import { useAppSelector } from "@/hook";
import { selectDuelHsStart } from "@/reducers/duel/mod";
import {
  selectHandSelectAble,
  selectTpSelectAble,
  unSelectHandAble,
  unSelectTpAble,
} from "@/reducers/moraSlice";
import { store } from "@/store";
import { valtioContext } from "@/valtioStores";
import { useSnapshot } from "valtio";

const {
  automation: { isAiMode, isAiFirst },
  defaults: { defaultMora },
} = useConfig();

const Mora = () => {
  const stateMora = useContext(valtioContext).moraStore;
  const snapMora = useSnapshot(stateMora);

  const dispatch = store.dispatch;
  const selectHandAble = useAppSelector(selectHandSelectAble);
  const selectTpAble = useAppSelector(selectTpSelectAble);
  const duelHsStart = useAppSelector(selectDuelHsStart);

  // const selectHandAble = snapMora.selectHandAble;
  // const selectTpAble = snapMora.selectTpAble;
  // const duelHsStart = snapMora.duelStart;

  const navigate = useNavigate();
  const { player, passWd, ip } = useParams<{
    player?: string;
    passWd?: string;
    ip?: string;
  }>();

  const handleSelectMora = (selected: string) => {
    sendHandResult(selected);
    dispatch(unSelectHandAble());
    stateMora.selectHandAble = false;
  };
  const handleSelectTp = (isFirst: boolean) => {
    sendTpResult(isFirst);
    dispatch(unSelectTpAble());
    stateMora.selectTpAble = false;
  };

  useEffect(() => {
    // 若对局已经开始，自动跳转
    if (duelHsStart) {
      navigate(`/duel/${player}/${passWd}/${ip}`);
    }
  }, [duelHsStart]);

  useEffect(() => {
    if (isAiMode) {
      handleSelectMora(defaultMora);
    }
  }, [selectHandAble]);

  useEffect(() => {
    if (isAiMode && !selectHandAble && selectTpAble) {
      handleSelectTp(!isAiFirst);
    }
  }, [selectHandAble, selectTpAble]);

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
