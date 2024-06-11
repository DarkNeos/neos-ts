import { fetchCard, fetchStrings, Region, ygopro } from "@/api";
import { roomStore } from "@/stores";
import ErrorType = ygopro.StocErrorMsg.ErrorType;

// TODO: 是时候需要一个统一管理国际化文案的模块了

const DECKERROR_LFLIST = 0x1;
const DECKERROR_OCGONLY = 0x2;
const DECKERROR_TCGONLY = 0x3;
const DECKERROR_UNKNOWNCARD = 0x4;
const DECKERROR_CARDCOUNT = 0x5;
const DECKERROR_MAINCOUNT = 0x6;
const DECKERROR_EXTRACOUNT = 0x7;
const DECKERROR_SIDECOUNT = 0x8;
const DECKERROR_NOTAVAIL = 0x9;

const language = localStorage.getItem('language');
const mainDeckWarining = language === 'en' ? 'The main deck should contain 40-60 cards.' : '主卡组数量应为40-60张';

export default async function handleErrorMsg(errorMsg: ygopro.StocErrorMsg) {
  const { error_type, error_code } = errorMsg;
  switch (error_type) {
    case ErrorType.JOINERROR: {
      roomStore.errorMsg = fetchStrings(Region.System, 1403 + error_code);
      break;
    }
    case ErrorType.DECKERROR: {
      const flag = error_code >> 28;
      const code = error_code & 0xfffffff;
      const card = fetchCard(code);
      const baseMsg = `卡组非法，请检查：${card.text.name}`;
      switch (flag) {
        case DECKERROR_LFLIST: {
          roomStore.errorMsg = baseMsg + "（数量不符合禁限卡表）";
          break;
        }
        case DECKERROR_OCGONLY: {
          roomStore.errorMsg = baseMsg + "（OCG独有卡，不能在当前设置使用）";
          break;
        }
        case DECKERROR_TCGONLY: {
          roomStore.errorMsg = baseMsg + "（TCG独有卡，不能在当前设置使用）";
          break;
        }
        case DECKERROR_UNKNOWNCARD: {
          if (code < 100000000) {
            roomStore.errorMsg =
              baseMsg + "（服务器无法识别此卡，可能是服务器未更新）";
          } else {
            roomStore.errorMsg =
              baseMsg +
              "（服务器无法识别此卡，可能是服务器不支持先行卡或此先行卡已正式更新）";
          }
          break;
        }
        case DECKERROR_CARDCOUNT: {
          roomStore.errorMsg = baseMsg + "（数量过多）";
          break;
        }
        case DECKERROR_MAINCOUNT: {
          roomStore.errorMsg = mainDeckWarining;
          break;
        }
        case DECKERROR_EXTRACOUNT: {
          roomStore.errorMsg = "额外卡组数量应为0-15张";
          break;
        }
        case DECKERROR_SIDECOUNT: {
          roomStore.errorMsg = "副卡组数量应为0-15张";
          break;
        }
        case DECKERROR_NOTAVAIL: {
          roomStore.errorMsg = `${card.text.name}不允许在当前设置下使用。`;
          break;
        }
        default: {
          roomStore.errorMsg = fetchStrings(Region.System, 1406);
          break;
        }
      }
      break;
    }
    case ErrorType.SIDEERROR: {
      roomStore.errorMsg = "更换副卡组失败，请检查卡片张数是否一致。";
      break;
    }
    case ErrorType.VERSIONERROR: {
      roomStore.errorMsg = "版本不匹配，请联系技术人员解决";
      break;
    }
    default:
      break;
  }
}
