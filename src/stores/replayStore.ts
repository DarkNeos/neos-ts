import { proxy } from "valtio";

import { YgoProPacket } from "@/api/ocgcore/ocgAdapter/packet";

// 对局中每一次状态改变的记录
interface ReplaySpot {
  msg: string; // 人类能理解的语音，后续考虑用来在对局中展示
  packet: ReplayPacket; // 将会保存在回放文件中的数据
}

// 保存回放信息的数据包
interface ReplayPacket {
  func: number; // 对应的`GAME_MSG`编号
  extraData: ArrayBuffer;
}

class ReplayStore {
  inner: ReplaySpot[] = [];
  record(ygoPacket: YgoProPacket, msg?: string) {
    this.inner.push({
      msg: msg ?? "",
      packet: ygoPacket2replayPacket(ygoPacket),
    });
  }
  encode(): ArrayBuffer[] {
    return this.inner.map((spot) => spot.packet).map(replayPacket2arrayBuffer);
  }
  clear() {
    this.inner = [];
  }
}

const ygoPacket2replayPacket = (ygoPacket: YgoProPacket) => ({
  func: ygoPacket.exData[0],
  extraData: ygoPacket.exData.slice(1),
});

const replayPacket2arrayBuffer = (replayPacket: ReplayPacket) => {
  const { func, extraData } = replayPacket;
  const packetLen = 1 + 4 + extraData.byteLength;
  const array = new Uint8Array(packetLen);
  const dataview = new DataView(array.buffer);

  dataview.setUint8(0, func);
  dataview.setUint32(1, extraData.byteLength, true);
  array.set(new Uint8Array(extraData), 5);

  return array.buffer;
};

export const replayStore = proxy(new ReplayStore());
