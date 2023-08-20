import Cookies from "cookies-ts";

const cookies = new Cookies();

export enum CookieKeys {
  USER = "user",
}

export const getCookie = <T>(key: CookieKeys) => {
  return cookies.get(key) as unknown as T | null;
};

export const setCookie = <T>(key: CookieKeys, value: T) => {
  cookies.set(key, value, {
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60), // 两个月的cookie，应该很充裕
  });
};

export const removeCookie = (key: CookieKeys) => {
  cookies.remove(key);
};
