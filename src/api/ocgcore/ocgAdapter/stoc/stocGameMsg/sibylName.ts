import { ygopro } from "@/api/ocgcore/idl/ocgcore";
import MsgSibylName = ygopro.StocGameMessage.MsgSibylName;

const LEN = 100;

/*
 * Msg Sibyl Name
 * @param - TODO
 *
 * @usage - Replay模式获取对战双方的昵称
 * */
export default (data: Uint8Array) => {
  const decoder = new TextDecoder("utf-16");
  let offset = 0;

  const name_0 = cutString(decoder.decode(data.slice(offset, offset + LEN)));
  offset += LEN;
  const name_0_tag = cutString(
    decoder.decode(data.slice(offset, offset + LEN))
  );
  offset += LEN;
  const name_0_c = cutString(decoder.decode(data.slice(offset, offset + LEN)));
  offset += LEN;
  const name_1 = cutString(decoder.decode(data.slice(offset, offset + LEN)));
  offset += LEN;
  const name_1_tag = cutString(
    decoder.decode(data.slice(offset, offset + LEN))
  );
  offset += LEN;
  const name_1_c = cutString(decoder.decode(data.slice(offset, offset + LEN)));

  return new MsgSibylName({
    name_0,
    name_0_tag,
    name_0_c,
    name_1,
    name_1_tag,
    name_1_c,
  });
};

function cutString(str: string): string {
  const end = str.indexOf("\0");
  return str.substring(0, end);
}
