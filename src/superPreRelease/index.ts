import SuperReleaseData from "../../super-pre-release.json";

export function isSuperReleaseCard(code: number): boolean {
  return SuperReleaseData.find((id) => id === code) !== undefined;
}
