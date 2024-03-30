import { useConfig } from "@/config";

const { preReleaseConfig } = useConfig();

interface SuperPreInfo {
  /* only use id currently, other fields see:
   * https://cdn02.moecube.com:444/ygopro-super-pre/data/test-release-v2.json
   * */
  id: number;
}

let superPreList: SuperPreInfo[] = [];

export async function initSuperPrerelease() {
  const json = await (await fetch(preReleaseConfig)).text();
  const list: SuperPreInfo[] = JSON.parse(json);
  superPreList = list;
}

export function isSuperReleaseCard(code: number): boolean {
  if (superPreList.length === 0)
    console.warn("Super pre release config has not been initialized!");
  return superPreList.find(({ id }) => id === code) !== undefined;
}
