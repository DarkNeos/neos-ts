import { fetchCard, fetchStrings, getStrings, ygopro } from "@/api";
import { messageStore } from "@/stores";
import MsgAnnounce = ygopro.StocGameMessage.MsgAnnounce;

const { announceModal } = messageStore;

export default async (announce: MsgAnnounce) => {
  const type_ = announce.announce_type;
  let min = announce.min;
  if (
    type_ == MsgAnnounce.AnnounceType.Card ||
    type_ == MsgAnnounce.AnnounceType.Number
  ) {
    min = 1;
  }
  announceModal.min = min;

  switch (type_) {
    case MsgAnnounce.AnnounceType.RACE: {
      announceModal.title = fetchStrings("!system", 563);
      announceModal.options = announce.options.map((option) => ({
        info: fetchStrings("!system", 1200 + option.code),
        response: option.response,
      }));
      announceModal.isOpen = true;

      break;
    }
    case MsgAnnounce.AnnounceType.Attribute: {
      announceModal.title = fetchStrings("!system", 562);
      announceModal.options = announce.options.map((option) => ({
        info: fetchStrings("!system", 1010 + option.code),
        response: option.response,
      }));
      announceModal.isOpen = true;

      break;
    }
    case MsgAnnounce.AnnounceType.Card: {
      announceModal.title = fetchStrings("!system", 564);
      announceModal.options = await Promise.all(
        announce.options.map(async (option) => ({
          info: await fetchCard(option.code).then(
            (meta) => meta.text.name ?? "[?]"
          ),
          response: option.response,
        }))
      );
      announceModal.isOpen = true;

      break;
    }
    case MsgAnnounce.AnnounceType.Number: {
      announceModal.title = fetchStrings("!system", 565);
      announceModal.options = announce.options.map((option) => ({
        info: option.code.toString(),
        response: option.response,
      }));
      announceModal.isOpen = true;

      break;
    }
    default: {
      console.warn(`Unknown announce_type = ${type_}`);
    }
  }
};
