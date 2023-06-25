import { fetchCard, fetchStrings, ygopro } from "@/api";
import { displayAnnounceModal } from "@/ui/Duel/Message";
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
      await displayAnnounceModal({
        min,
        title: fetchStrings("!system", 563),
        options: announce.options.map((option) => ({
          info: fetchStrings("!system", 1200 + option.code),
          response: option.response,
        })),
      });

      break;
    }
    case MsgAnnounce.AnnounceType.Attribute: {
      await displayAnnounceModal({
        min,
        title: fetchStrings("!system", 562),
        options: announce.options.map((option) => ({
          info: fetchStrings("!system", 1010 + option.code),
          response: option.response,
        })),
      });

      break;
    }
    case MsgAnnounce.AnnounceType.Card: {
      const options = [];
      for (const option of announce.options) {
        const meta = await fetchCard(option.code);
        if (meta.text.name) {
          options.push({
            info: meta.text.name,
            response: option.response,
          });
        }
      }
      await displayAnnounceModal({
        min,
        title: fetchStrings("!system", 564),
        options,
      });

      break;
    }
    case MsgAnnounce.AnnounceType.Number: {
      await displayAnnounceModal({
        min,
        title: fetchStrings("!system", 565),
        options: announce.options.map((option) => ({
          info: option.code.toString(),
          response: option.response,
        })),
      });

      break;
    }
    default: {
      console.warn(`Unknown announce_type = ${type_}`);
    }
  }
};
