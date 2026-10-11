/** 场上选择与弹窗共用的协议校验。min/max 在合计手续中不包含必选卡。 */
export interface SelectionValue {
  level1?: number;
  level2?: number;
  tributeValue?: number;
}
export interface SelectionRules {
  selectionKind?: "count" | "tribute" | "sum";
  min: number;
  max: number;
  totalLevels: number;
  overflow: boolean;
  /** 每次确认只选择一张；逐张选择的累计结果由服务器管理。 */
  single: boolean;
}

const levels = (card: SelectionValue) => {
  const first = card.level1 ?? 0;
  return [...new Set([first, card.level2 || first])];
};

export function validSelection(
  selected: readonly SelectionValue[],
  mandatory: readonly SelectionValue[],
  rules: SelectionRules,
): boolean {
  if (rules.single) return selected.length === 1;
  // 解放的 min 表示需要的贡献值，max 表示最多选择的实际卡片张数。
  if (rules.selectionKind === "tribute")
    return (
      selected.length <= rules.max &&
      selected.reduce((sum, card) => sum + (card.tributeValue ?? 1), 0) >=
        rules.min
    );
  if (rules.selectionKind !== "sum" && !rules.totalLevels)
    return selected.length >= rules.min && selected.length <= rules.max;
  const cards = [...mandatory, ...selected];
  if (!cards.length) return false;
  if (rules.overflow) {
    // OCG 的 sum-greater：最大值总和足够，且最小值总和不能容许再少一张。
    const minima = cards.map((card) => Math.min(...levels(card)));
    const maximum = cards.reduce(
      (sum, card) => sum + Math.max(...levels(card)),
      0,
    );
    const minimum = minima.reduce((sum, value) => sum + value, 0);
    return (
      maximum >= rules.totalLevels &&
      minimum - Math.min(...minima) < rules.totalLevels
    );
  }
  if (selected.length < rules.min || selected.length > rules.max) return false;
  // 每张卡可以采用两种贡献值中的一种，保留可达合计值来判断精确匹配。
  let sums = new Set([0]);
  for (const card of cards) {
    const next = new Set<number>();
    for (const sum of sums)
      for (const value of levels(card))
        if (sum + value <= rules.totalLevels) next.add(sum + value);
    sums = next;
  }
  return sums.has(rules.totalLevels);
}

/** 判断当前选择是否还能补成合法组合，用于隐藏无解候选的高亮。 */
export function canCompleteSelection(
  selected: readonly SelectionValue[],
  remaining: readonly SelectionValue[],
  mandatory: readonly SelectionValue[],
  rules: SelectionRules,
): boolean {
  if (validSelection(selected, mandatory, rules)) return true;
  const maxCount =
    rules.selectionKind === "sum" && rules.overflow
      ? selected.length + remaining.length
      : rules.max;
  if (selected.length >= maxCount) return false;
  if (rules.selectionKind === "tribute") {
    const contribution = selected.reduce(
      (sum, card) => sum + (card.tributeValue ?? 1),
      0,
    );
    const available = remaining
      .map((card) => card.tributeValue ?? 1)
      .sort((a, b) => b - a)
      .slice(0, maxCount - selected.length);
    return contribution + available.reduce((a, b) => a + b, 0) >= rules.min;
  }
  if (rules.selectionKind !== "sum" && !rules.totalLevels)
    return selected.length + remaining.length >= rules.min;
  if (rules.overflow) {
    // 已选的最小值过大时，继续加卡也不能消除冗余。
    const cards = [...mandatory, ...selected];
    const mins = cards.map((card) => Math.min(...levels(card)));
    if (
      mins.length &&
      mins.reduce((a, b) => a + b, 0) - Math.min(...mins) >= rules.totalLevels
    )
      return false;
    // 正贡献卡先取最小值；最大值只用于判断是否能够达到目标。
    const search = (
      index: number,
      chosen: readonly SelectionValue[],
    ): boolean => {
      if (validSelection(chosen, mandatory, rules)) return true;
      if (index === remaining.length) return false;
      const current = [...mandatory, ...chosen];
      const low = current.map((card) => Math.min(...levels(card)));
      if (
        low.length &&
        low.reduce((a, b) => a + b, 0) - Math.min(...low) >= rules.totalLevels
      )
        return false;
      const possible = [...current, ...remaining.slice(index)].reduce(
        (sum, card) => sum + Math.max(...levels(card)),
        0,
      );
      if (possible < rules.totalLevels) return false;
      return (
        search(index + 1, [...chosen, remaining[index]]) ||
        search(index + 1, chosen)
      );
    };
    return search(0, selected);
  }
  // DP 按张数与合计值去重，避免枚举所有卡片子集。
  // 必选卡只增加合计值；count 始终表示可选卡张数，供 min/max 校验。
  let sums = new Map<number, Set<number>>([[selected.length, new Set([0])]]);
  for (const card of [...mandatory, ...selected]) {
    const next = new Map<number, Set<number>>();
    for (const [count, values] of sums) {
      const result = new Set<number>();
      for (const sum of values)
        for (const level of levels(card))
          if (sum + level <= rules.totalLevels) result.add(sum + level);
      next.set(count, result);
    }
    sums = next;
  }
  for (const card of remaining) {
    const next = new Map(
      [...sums].map(([count, values]) => [count, new Set(values)]),
    );
    for (const [count, values] of sums) {
      if (count >= maxCount) continue;
      const result = next.get(count + 1) ?? new Set<number>();
      for (const sum of values)
        for (const level of levels(card))
          if (sum + level <= rules.totalLevels) result.add(sum + level);
      next.set(count + 1, result);
    }
    sums = next;
  }
  return [...sums].some(
    ([count, values]) =>
      count >= rules.min && count <= rules.max && values.has(rules.totalLevels),
  );
}
