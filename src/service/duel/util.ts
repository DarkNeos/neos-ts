import { ygopro } from "@/api";
const { MZONE, SZONE, HAND } = ygopro.CardZone;

export function isAllOnField(locations: ygopro.CardLocation[]): boolean {
  const isOnField = (location: ygopro.CardLocation) => {
    return [MZONE, SZONE, HAND].includes(location.zone);
  };

  return locations.find((location) => !isOnField(location)) === undefined;
}
