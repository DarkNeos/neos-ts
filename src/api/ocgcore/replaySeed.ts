/** YRP1 客户端以文件中的 seed 初始化 MT19937，再取第一个值创建对局。 */
export function yrp1DuelSeed(seed: number): number {
  let state = seed >>> 0;
  let state1 = 0;
  for (let index = 1; index <= 397; index++) {
    state = (Math.imul(1812433253, state ^ (state >>> 30)) + index) >>> 0;
    if (index === 1) state1 = state;
  }
  const mixed = (seed & 0x80000000) | (state1 & 0x7fffffff);
  let value = state ^ (mixed >>> 1) ^ (mixed & 1 ? 0x9908b0df : 0);
  value ^= value >>> 11;
  value ^= (value << 7) & 0x9d2c5680;
  value ^= (value << 15) & 0xefc60000;
  value ^= value >>> 18;
  return value >>> 0;
}
