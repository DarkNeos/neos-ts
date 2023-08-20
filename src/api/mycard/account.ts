/** 构建一个单点登录（Single Sign-On，简称SSO）的URL */
import { useConfig } from "@/config";

const NeosConfig = useConfig();

export function getSSOSignInUrl(callbackUrl: string): string {
  const params = new URLSearchParams({
    sso: btoa(new URLSearchParams({ return_sso_url: callbackUrl }).toString()),
  });

  const url = new URL(NeosConfig.loginUrl);
  url.search = params.toString();

  return url.toString();
}

export function getSSOSignOutUrl(callbackUrl: string): string {
  const params = new URLSearchParams({
    redirect: callbackUrl,
  });

  const url = new URL(NeosConfig.logoutUrl);
  url.search = params.toString();

  return url.toString();
}
