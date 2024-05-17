import { Avatar, Dropdown } from "antd";
import classNames from "classnames";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  type LoaderFunction,
  NavLink,
  Outlet,
  useLocation,
} from "react-router-dom";
import { useSnapshot } from "valtio";

import {
  CookieKeys,
  getSSOSignInUrl,
  getSSOSignOutUrl,
  removeCookie,
} from "@/api";
import { useConfig } from "@/config";
import LanguageSelector from "@/Language/LanguageSelector";
import { accountStore } from "@/stores";

import styles from "./index.module.scss";
import {
  getLoginStatus,
  handleSSOLogin,
  initDeck,
  initForbidden,
  initI18N,
  initSqlite,
  initSuper,
  initWASM,
} from "./utils";

const NeosConfig = useConfig();

export const loader: LoaderFunction = async () => {
  getLoginStatus();
  initDeck();
  initSqlite();
  initWASM();
  initForbidden();
  initI18N();
  initSuper();
  return null;
};

const HeaderBtn: React.FC<
  React.PropsWithChildren<{ to: string; disabled?: boolean }>
> = ({ to, children, disabled = false }) => {
  const Element = disabled ? "div" : NavLink;
  return (
    <Element
      to={disabled ? "/" : to}
      className={classNames(styles.link, { [styles.disabled]: disabled })}
    >
      {children}
    </Element>
  );
};

export const Component = () => {
  const { t } = useTranslation("Header");

  // 捕获SSO登录
  const routerLocation = useLocation();
  useEffect(() => {
    routerLocation.search && handleSSOLogin(routerLocation.search);
  }, [routerLocation.search]);

  // 根据是否登录，显示内容
  const logined = Boolean(useSnapshot(accountStore).user);

  const { pathname } = routerLocation;
  const pathnamesHideHeader = ["/waitroom", "/duel", "/side"];

  const callbackUrl = `${location.origin}/match/`;
  const onLogin = () => location.replace(getSSOSignInUrl(callbackUrl));
  const onLogout = () => {
    removeCookie(CookieKeys.USER);
    accountStore.logout();
    // 跳转SSO登出
    location.replace(getSSOSignOutUrl(callbackUrl));
  };

  return (
    <>
      {!pathnamesHideHeader.includes(pathname) && (
        <nav className={styles.navbar}>
          <a
            href="https://github.com/DarkNeos/neos-ts"
            title="repo"
            className={styles["logo-container"]}
          >
            <img
              className={styles.logo}
              src={`${NeosConfig.assetsPath}/neos-logo.svg`}
              alt="NEOS"
            />
          </a>

          <HeaderBtn to="/">{t("HomePage")}</HeaderBtn>
          <HeaderBtn to="/match" disabled={!logined}>
            {t("Match")}
          </HeaderBtn>
          <HeaderBtn to="/build" disabled={!logined}>
            {t("DeckBuilding")}
          </HeaderBtn>
          <span style={{ flexGrow: 1 }} />
          <LanguageSelector />
          <span className={styles.profile}>
            <Dropdown
              arrow
              menu={{
                items: [
                  {
                    label: (
                      <a href={NeosConfig.profileUrl} target="_blank">
                        {t("PersonalCenter")}
                      </a>
                    ),
                  },
                  {
                    label: (
                      <a href="https://ygobbs.com" target="_blank">
                        {t("MengkaCommunity")}
                      </a>
                    ),
                  },
                  {
                    label: (
                      <a
                        href="https://mycard.moe/ygopro/arena/#/"
                        target="_blank"
                      >
                        {t("DuelDatabase")}
                      </a>
                    ),
                  },
                  {
                    label: logined ? t("LogOut") : t("LoginToMengka"),
                    onClick: logined ? onLogout : onLogin,
                  },
                  {
                    label: t("Fullscreen"),
                    onClick: () => document.documentElement.requestFullscreen(),
                    danger: true,
                  },
                ].map((x, key) => ({ ...x, key })),
              }}
            >
              <div>
                <NeosAvatar />
              </div>
            </Dropdown>
          </span>
        </nav>
      )}
      <main className={styles.main}>
        <Outlet />
      </main>
    </>
  );
};

const NeosAvatar = () => {
  const { user } = useSnapshot(accountStore);
  return (
    <Avatar size="small" src={user?.avatar_url} style={{ cursor: "pointer" }} />
  );
};
