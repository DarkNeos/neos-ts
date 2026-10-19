import { useConfig } from "@/config";
import { pfetch } from "@/infra/pfetch";

const {
  preReleaseResource: { config },
} = useConfig();

interface SuperPreInfo {
  /* only use id currently, other fields see:
   * https://cdn02.moecube.com:444/ygopro-super-pre/data/test-release-v2.json
   * */
  id: number;
}

let superPreList: SuperPreInfo[] = [];

export async function initSuperPrerelease(version?: string) {
  const url = new URL(config);
  if (version !== undefined) url.searchParams.set("v", version);
  const json = await (
    await pfetch(url.href, {
      init: { cache: version === undefined ? undefined : "no-cache" },
    })
  ).text();
  const list: SuperPreInfo[] = JSON.parse(json);
  superPreList = list;
}

export function isSuperReleaseCard(code: number): boolean {
  if (superPreList.length === 0)
    console.warn("Super pre release config has not been initialized!");
  return superPreList.find(({ id }) => id === code) !== undefined;
}
