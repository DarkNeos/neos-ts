import { ygopro } from "../../../idl/ocgcore";
import { BufferWriter } from "rust-src";

export default (
  response: ygopro.CtosGameMsgResponse.SelectPositionResponse
) => {
  const writer = new BufferWriter();

  switch (response.position) {
    case ygopro.CardPosition.FACEUP_ATTACK: {
      writer.writeUint32(0x1);

      break;
    }
    case ygopro.CardPosition.FACEDOWN_ATTACK: {
      writer.writeUint32(0x2);

      break;
    }
    case ygopro.CardPosition.FACEUP_DEFENSE: {
      writer.writeUint32(0x4);

      break;
    }
    case ygopro.CardPosition.FACEDOWN_DEFENSE: {
      writer.writeUint32(0x8);

      break;
    }
    default: {
      console.warn(`Unsupported position type: ${response.position}`);
    }
  }

  return writer.toArray();
};
