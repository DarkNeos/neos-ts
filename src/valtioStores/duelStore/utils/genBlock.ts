import { ygopro } from "@/api/ocgcore/idl/ocgcore";
/**
 * 生成一个指定长度的卡片数组
 */
function genBlock(location: ygopro.CardZone, n: number = 5) {
  return {
    me: Array(n)
      .fill(null)
      .map((_) => ({
        location: {
          location,
        },
        idleInteractivities: [],
        counters: {},
      })),
    op: Array(n)
      .fill(null)
      .map((_) => ({
        location: {
          location,
        },
        idleInteractivities: [],
        counters: {},
      })),
  };
}
