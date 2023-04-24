import { fetchCard } from "@/api";
import { matStore } from "@/valtioStores";

export const fetchOverlayMeta = async (
  controller: number,
  sequence: number,
  overlayCodes: number[],
  append?: boolean
) => {
  const metas = await Promise.all(
    overlayCodes.map(async (id) => await fetchCard(id))
  );

  const target = matStore.monsters.at(controller)[sequence];
  if (target && target.occupant) {
    if (append) {
      target.overlay_materials = (target.overlay_materials || []).concat(metas);
    } else {
      target.overlay_materials = metas;
    }
  }
};
