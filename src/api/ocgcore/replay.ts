import { readYrp3dPackets } from "ygopro-yrp3d-encode";

import { YgoProPacket } from "./ocgAdapter/packet";
import { STOC_GAME_MSG } from "./ocgAdapter/protoDecl";

interface ReplayRecord {
  func: number;
  data: ArrayBuffer;
}

export function parseYrp3dRecords(buffer: ArrayBuffer): ReplayRecord[] {
  return readYrp3dPackets(new Uint8Array(buffer)).map(({ type, payload }) => ({
    func: type,
    data: payload.slice().buffer as ArrayBuffer,
  }));
}

export function yrp3dToStocGameMsgBuffers(buffer: ArrayBuffer): ArrayBuffer[] {
  return parseYrp3dRecords(buffer)
    .filter((record) => record.func !== 231)
    .map(recordToStocGameMsgPacket)
    .map((packet) => packet.serialize().buffer as ArrayBuffer);
}

function recordToStocGameMsgPacket(record: ReplayRecord): YgoProPacket {
  const exData = new Uint8Array(1 + record.data.byteLength);
  exData[0] = record.func;
  exData.set(new Uint8Array(record.data), 1);

  return new YgoProPacket(1 + exData.byteLength, STOC_GAME_MSG, exData);
}
