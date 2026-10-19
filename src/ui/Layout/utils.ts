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
import { readResourceVersion } from "@/infra/resourceVersion";
import sqliteMiddleWare, { sqliteCmd } from "@/middleware/sqlite";
import { accountStore, deckStore, initStore, type User } from "@/stores";

const { releaseResource, preReleaseResource, env408Resource } = useConfig();

let sqliteTask: Promise<void> | undefined;
let initialization: Promise<void> | undefined;
let preReleaseVersion: Promise<string | undefined> | undefined;

/** 同一轮加载共用任务，失败后可重新下载。 */
export const initSqlite = (version?: string): Promise<void> => {
  if (initStore.sqlite.progress === 1) return Promise.resolve();
  if (sqliteTask) return sqliteTask;
  initStore.sqlite.progress = 0.01;
  sqliteTask = sqliteMiddleWare({
    cmd: sqliteCmd.INIT,
    initInfo: {
      releaseDbUrl: releaseResource.cdb,
      preReleaseDbUrl: preReleaseResource.cdb,
      preReleaseDbVersion: version,
      progressCallback: (progress) => {
        initStore.sqlite.progress = Math.max(
          initStore.sqlite.progress,
          progress * 0.9,
        );
      },
    },
  })
    .then(() => {
      initStore.sqlite.progress = 1;
    })
    .catch((error) => {
      initStore.sqlite.progress = 0;
      throw error;
    })
    .finally(() => {
      sqliteTask = undefined;
    });
  return sqliteTask;
};

export const initDeck = async () => {
  if (!initStore.decks) {
    await deckStore.initialize();
    initStore.decks = true;
  }
};

export const initForbidden = async () => {
  if (!initStore.forbidden) {
    await Promise.all([
      forbidden.init(releaseResource.lflist),
      forbidden_408.init(env408Resource.lflist),
    ]);
    initStore.forbidden = true;
  }
};

export const initI18N = async () => {
  if (!initStore.i18n) {
    await initStrings();
    initStore.i18n = true;
  }
};

export const initSuper = async (version?: string) => {
  if (!initStore.superprerelease) {
    await initSuperPrerelease(version);
    initStore.superprerelease = true;
  }
};

export const initializeApp = (): Promise<void> => {
  if (initStore.ready) return Promise.resolve();
  if (initialization) return initialization;
  initStore.loading = true;
  initStore.error = "";
  // 等所有任务结束再允许重试，防止旧任务仍写入状态时开始新一轮初始化。
  // 已成功的资源保留完成标记，下一轮只重试尚未完成的部分。
  // 卡库和分类列表共用一次版本检查，资源重试也保持同一版本。
  initialization = (preReleaseVersion ??= readResourceVersion(
    preReleaseResource.version,
  ))
    .then((version) =>
      Promise.allSettled([
        initDeck(),
        initSqlite(version),
        initForbidden(),
        initI18N(),
        initSuper(version),
      ]),
    )
    .then((results) => {
      const failure = results.find((result) => result.status === "rejected");
      if (failure?.status === "rejected") throw failure.reason;
      initStore.ready = true;
    })
    .catch((error) => {
      initStore.error =
        error instanceof Error ? error.message : "初始化失败，请重试";
      throw error;
    })
    .finally(() => {
      initStore.loading = false;
      initialization = undefined;
    });
  return initialization;
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
