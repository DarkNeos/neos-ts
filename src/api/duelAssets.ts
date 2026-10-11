import { useConfig } from "@/config";

export function duelAssetUrl(path: string) {
  const { assetsPath } = useConfig();
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/${assetsPath.replace(/^\/+|\/+$/g, "")}/${path}`;
}
