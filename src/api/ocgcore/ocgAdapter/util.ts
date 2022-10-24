export const UTF16_BUFFER_MAX_LEN = 20;
const FILLING_TOKEN: number = 0xcccc;

export function strEncodeUTF16(str: string) {
  let buf = new ArrayBuffer(UTF16_BUFFER_MAX_LEN * 2);
  let bufView = new Uint16Array(buf);
  bufView.fill(FILLING_TOKEN, 0, UTF16_BUFFER_MAX_LEN);

  for (
    let i = 0, strLen = str.length;
    i < strLen && i < UTF16_BUFFER_MAX_LEN;
    i++
  ) {
    bufView[i] = str.charCodeAt(i);

    if (i === strLen - 1 && i < bufView.length - 1) {
      bufView[i + 1] = 0;
    }
  }
  return new Uint8Array(buf);
}

// currently not used, but remain.
export function utf8ArrayToStr(array: Uint8Array) {
  let out, i, len, c;
  let char2, char3;

  out = "";
  len = array.length;
  i = 0;
  while (i < len) {
    c = array[i++];
    switch (c >> 4) {
      case 0:
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
      case 6:
      case 7:
        // 0xxxxxxx
        out += String.fromCharCode(c);
        break;
      case 12:
      case 13:
        // 110x xxxx   10xx xxxx
        char2 = array[i++];
        out += String.fromCharCode(((c & 0x1f) << 6) | (char2 & 0x3f));
        break;
      case 14:
        // 1110 xxxx  10xx xxxx  10xx xxxx
        char2 = array[i++];
        char3 = array[i++];
        out += String.fromCharCode(
          ((c & 0x0f) << 12) | ((char2 & 0x3f) << 6) | ((char3 & 0x3f) << 0)
        );
        break;
    }
  }

  return out;
}
