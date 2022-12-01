import { ygopro } from "../../../idl/ocgcore";
import { BufferReader } from "../../bufferIO";

const LITTLE_ENDIAN = true;

/*
 * Msg New Phase
 *
 * @param phase: uint16 - 下一个阶段
 *
 * @usage - 服务端告诉前端下一个阶段
 * */

export default (data: Uint8Array) => {
  const reader = new BufferReader(data, LITTLE_ENDIAN);

  const phase = reader.readUint16();

  let phaseType = ygopro.StocGameMessage.MsgNewPhase.PhaseType.UNKNOWN;
  switch (phase) {
    case 0x01: {
      phaseType = ygopro.StocGameMessage.MsgNewPhase.PhaseType.DRAW;

      break;
    }
    case 0x02: {
      phaseType = ygopro.StocGameMessage.MsgNewPhase.PhaseType.STANDBY;
      break;
    }
    case 0x04: {
      phaseType = ygopro.StocGameMessage.MsgNewPhase.PhaseType.MAIN1;

      break;
    }
    case 0x08: {
      phaseType = ygopro.StocGameMessage.MsgNewPhase.PhaseType.BATTLE_START;

      break;
    }
    case 0x10: {
      phaseType = ygopro.StocGameMessage.MsgNewPhase.PhaseType.BATTLE_STEP;

      break;
    }
    case 0x20: {
      phaseType = ygopro.StocGameMessage.MsgNewPhase.PhaseType.DAMAGE;

      break;
    }
    case 0x40: {
      phaseType = ygopro.StocGameMessage.MsgNewPhase.PhaseType.DAMAGE_GAL;

      break;
    }
    case 0x80: {
      phaseType = ygopro.StocGameMessage.MsgNewPhase.PhaseType.BATTLE;

      break;
    }
    case 0x100: {
      phaseType = ygopro.StocGameMessage.MsgNewPhase.PhaseType.MAIN2;

      break;
    }
    case 0x200: {
      phaseType = ygopro.StocGameMessage.MsgNewPhase.PhaseType.END;

      break;
    }
    default: {
      break;
    }
  }

  return new ygopro.StocGameMessage.MsgNewPhase({
    phase_type: phaseType,
  });
};
