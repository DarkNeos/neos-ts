/** 仅处理已知卡名，避免将区域名、效果描述误当作卡名。 */
export function quoteCardName(name?: string): string {
  return `『${name || "?"}』`;
}

/** 支持卡名或模板占位符，已有成对引号时统一替换，重复调用不会嵌套。 */
export function formatCardName(
  text: string,
  name: string,
  placeholder = name,
): string {
  if (!name || !placeholder) return text;
  const escaped = placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `『${escaped}』|「${escaped}」|“${escaped}”|"${escaped}"|${escaped}`,
    placeholder === name ? "g" : "",
  );
  return text.replace(pattern, () => quoteCardName(name));
}

/** 分开灵摆和怪兽效果，支持数据库中的中文、日文及英文段落标记。 */
export function splitPendulumDescription(input: string): [string, string] {
  const text = input.replace(/←.*?→/g, "").trim();
  const marker =
    /【(?:怪兽效果|怪獸效果|モンスター効果)】|\[\s*(?:Monster Effect|Efecto de Monstruo)\s*\]/i;
  const match = marker.exec(text);
  // 部分数据库用分隔线代替段落标题；缺少分隔时将全文保留为怪兽效果。
  const separator = match ?? /\r?\n[-─━]{3,}\r?\n/.exec(text);
  if (!separator) return ["", text];
  const pendulum = text
    .slice(0, separator.index)
    .replace(
      /【(?:灵摆效果|靈擺效果|Ｐ効果|P効果)】|\[\s*(?:Pendulum Effect|Efecto de Péndulo)\s*\]/gi,
      "",
    )
    .trim();
  const monster = text.slice(separator.index + separator[0].length).trim();
  return [pendulum, monster];
}
