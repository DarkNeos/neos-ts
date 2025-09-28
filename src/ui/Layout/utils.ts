import {
  CookieKeys,
  forbidden,
  forbidden_408,
  getCookie,
  initStrings,
  initSuperPrerelease,
  setCookie,
} from "@/api";
import { useConfig } from "@/config";
import sqliteMiddleWare, { sqliteCmd } from "@/middleware/sqlite";
import { accountStore, deckStore, initStore, type User } from "@/stores";

const { releaseResource, preReleaseResource, env408Resource } = useConfig();

/** 加载ygodb */
export const initSqlite = async () => {
  if (!initStore.sqlite.progress) {
    const { sqlite } = initStore;
    const progressCallback = (progress: number) =>
      (sqlite.progress = progress * 0.9);
    sqlite.progress = 0.01;
    await sqliteMiddleWare({
      cmd: sqliteCmd.INIT,
      initInfo: {
        releaseDbUrl: releaseResource.cdb,
        preReleaseDbUrl: preReleaseResource.cdb,
        progressCallback,
      },
    });
    sqlite.progress = 1;
  }
};

/** 加载卡组 */
export const initDeck = async () => {
  if (!initStore.decks) {
    await deckStore.initialize();
    initStore.decks = true;
  }
};

/** 加载禁限卡表 */
export const initForbidden = async () => {
  if (!initStore.forbidden) {
    await forbidden.init(releaseResource.lflist);
    await forbidden_408.init(env408Resource.lflist);
    initStore.forbidden = true;
  }
};

/** 加载I18N文案 */
export const initI18N = async () => {
  if (!initStore.i18n) {
    await initStrings();
    initStore.i18n = true;
  }
};

/** 加载超先行服配置 */
export const initSuper = async () => {
  if (!initStore.superprerelease) {
    await initSuperPrerelease();
    initStore.superprerelease = true;
  }
};

/** sso登录跳转回来 */
export const handleSSOLogin = async (search: string) => {
  /** 从SSO跳转回的URL之中，解析用户信息 */
  function getSSOUser(searchParams: URLSearchParams): User {
    return Object.fromEntries(searchParams) as unknown as User;
  }

  const sso = new URLSearchParams(search).get("sso");
  const user = sso ? getSSOUser(new URLSearchParams(atob(sso))) : undefined;
  if (user) {
    // Convert userID to [`Number`] here
    user.id = Number(user.id);
    accountStore.login(user);
    setCookie(CookieKeys.USER, JSON.stringify(user));
    // TODO: toast显示登录成功
  }
};

/** 从cookie获取登录态 */
export const getLoginStatus = async () => {
  const user = getCookie<User>(CookieKeys.USER);
  if (user) accountStore.login(user);
};
