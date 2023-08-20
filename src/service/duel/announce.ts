import { fetchCard, fetchStrings, Region, ygopro } from "@/api";
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
        title: fetchStrings(Region.System, 563),
        options: announce.options.map((option) => ({
          info: fetchStrings(Region.System, 1200 + option.code),
          response: option.response,
        })),
      });

      break;
    }
    case MsgAnnounce.AnnounceType.Attribute: {
      await displayAnnounceModal({
        min,
        title: fetchStrings(Region.System, 562),
        options: announce.options.map((option) => ({
          info: fetchStrings(Region.System, 1010 + option.code),
          response: option.response,
        })),
      });

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
      await displayAnnounceModal({
        min,
        title: fetchStrings(Region.System, 564),
        options,
      });

      break;
    }
    case MsgAnnounce.AnnounceType.Number: {
      await displayAnnounceModal({
        min,
        title: fetchStrings(Region.System, 565),
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
