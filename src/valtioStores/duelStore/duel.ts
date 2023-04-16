import { proxy } from "valtio";
import type { DuelState } from "./types";
import { ygopro } from "@/api/ocgcore/idl/ocgcore";

export const playMat = proxy<DuelState>({
  opMagics: {
    inner: Array(5)
      .fill(null)
      .map((_, i) => ({
        location: {
          location: ygopro.CardZone.SZONE,
        },
        idleInteractivities: [],
        counters: {},
      })),
  },
});
