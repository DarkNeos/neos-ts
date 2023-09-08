import { fetchCard, fetchStrings, Region, ygopro } from "@/api";
import { displayOptionModal } from "@/ui/Duel/Message";
import MsgAnnounce = ygopro.StocGameMessage.MsgAnnounce;

export default async (announce: MsgAnnounce) => {
  const type_ = announce.announce_type;
  let min = announce.min;
  if (
    type_ === MsgAnnounce.AnnounceType.Card ||
    type_ === MsgAnnounce.AnnounceType.Number
  ) {
    min = 1;
  }

  switch (type_) {
    case MsgAnnounce.AnnounceType.RACE: {
      await displayOptionModal(
        fetchStrings(Region.System, 563),
        announce.options.map((option) => ({
          info: fetchStrings(Region.System, 1020 + option.code),
          response: option.response,
        })),
        min,
      );

      break;
    }
    case MsgAnnounce.AnnounceType.Attribute: {
      await displayOptionModal(
        fetchStrings(Region.System, 562),
        announce.options.map((option) => ({
          info: fetchStrings(Region.System, 1010 + option.code),
          response: option.response,
        })),
        min,
      );

      break;
    }
    case MsgAnnounce.AnnounceType.Card: {
      const options = [];
      for (const option of announce.options) {
        const meta = fetchCard(option.code);
        if (meta.text.name) {
          options.push({
            info: meta.text.name,
            response: option.response,
          });
        }
      }
      await displayOptionModal(fetchStrings(Region.System, 564), options, min);

      break;
    }
    case MsgAnnounce.AnnounceType.Number: {
      await displayOptionModal(
        fetchStrings(Region.System, 565),
        announce.options.map((option) => ({
          info: option.code.toString(),
          response: option.response,
        })),
        min,
      );

      break;
    }
    default: {
      console.warn(`Unknown announce_type = ${type_}`);
    }
  }
};
