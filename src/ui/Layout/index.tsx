import {
  DatabaseFilled,
  FullscreenOutlined,
  LoginOutlined,
  LogoutOutlined,
  SettingFilled,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { App, Avatar, Dropdown } from "antd";
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
import { useAdaptiveViewportScale } from "@/hook";
import { accountStore } from "@/stores";
import { deckLibraryStore } from "@/stores/deckLibraryStore";
import { mdproDeckStore } from "@/stores/mdproDeckStore";

import { setCssProperties } from "../Duel/PlayMat/css";
import { Setting } from "../Setting";
import { ConnectionStatus } from "../Shared/ConnectionStatus";
import styles from "./index.module.scss";
import { getLoginStatus, handleSSOLogin, initializeApp } from "./utils";

const NeosConfig = useConfig();
const DEFAULT_VIEWPORT_SCALE = { designWidth: 1000, designHeight: 620 };
const DUEL_VIEWPORT_SCALE = { designWidth: 1000, designHeight: 920 };

export const loader: LoaderFunction = async () => {
  getLoginStatus();
  void initializeApp().catch(() => undefined);
  mdproDeckStore.setAccount(accountStore.user);
  void mdproDeckStore.load();

  // set some styles
  setCssProperties();

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
  const { t: i18n } = useTranslation("Header");

  // 捕获SSO登录
  const routerLocation = useLocation();
  useEffect(() => {
    routerLocation.search && handleSSOLogin(routerLocation.search);
  }, [routerLocation.search]);

  // 根据是否登录，显示内容
  const { user } = useSnapshot(accountStore);
  const logined = Boolean(user);
  useEffect(() => {
    void deckLibraryStore.setAccount(user);
  }, [user]);

  const { pathname } = routerLocation;
  useAdaptiveViewportScale(
    pathname === "/duel" ? DUEL_VIEWPORT_SCALE : DEFAULT_VIEWPORT_SCALE,
  );
  const pathnamesHideHeader = ["/waitroom", "/duel", "/side"];
  const { modal } = App.useApp();
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

          <HeaderBtn to="/">{i18n("HomePage")}</HeaderBtn>
          <HeaderBtn to="/match" disabled={!logined}>
            {i18n("Match")}
          </HeaderBtn>
          <HeaderBtn to="/build" disabled={!logined}>
            {i18n("DeckBuilding")}
          </HeaderBtn>
          <span style={{ flexGrow: 1 }} />
          <span className={styles.profile}>
            <Dropdown
              arrow
              menu={{
                items: [
                  {
                    label: (
                      <a href={NeosConfig.profileUrl} target="_blank">
                        <>
                          <UserOutlined style={{ fontSize: "16px" }} />{" "}
                          <strong>{i18n("PersonalCenter")}</strong>
                        </>
                      </a>
                    ),
                  },
                  {
                    label: (
                      <a href="https://ygobbs.com" target="_blank">
                        <>
                          <TeamOutlined style={{ fontSize: "16px" }} />{" "}
                          <strong>{i18n("MyCardCommunity")}</strong>
                        </>
                      </a>
                    ),
                  },
                  {
                    label: (
                      <a
                        href="https://mycard.moe/ygopro/arena/#/"
                        target="_blank"
                      >
                        <>
                          <DatabaseFilled style={{ fontSize: "16px" }} />{" "}
                          <strong>{i18n("DuelDatabase")}</strong>
                        </>
                      </a>
                    ),
                  },
                  {
                    label: (
                      <>
                        <SettingFilled />{" "}
                        <strong>{i18n("SystemSettings")}</strong>
                      </>
                    ),
                    onClick: () => {
                      modal.info({
                        content: (
                          <>
                            <Setting />
                          </>
                        ),
                        centered: true,
                        maskClosable: true,
                        icon: null,
                        footer: null,
                      });
                    },
                  },
                  {
                    label: (
                      <>
                        <strong style={{ color: "#1890ff" }}>
                          <FullscreenOutlined style={{ fontSize: "16px" }} />{" "}
                          {i18n("Fullscreen")}
                        </strong>
                      </>
                    ),
                    onClick: () => document.documentElement.requestFullscreen(),
                  },
                  {
                    label: logined ? (
                      <>
                        <LogoutOutlined style={{ fontSize: "16px" }} />{" "}
                        <strong>{i18n("LogOut")}</strong>
                      </>
                    ) : (
                      <>
                        <LoginOutlined style={{ fontSize: "16px" }} />{" "}
                        <strong>{i18n("Login")}</strong>
                      </>
                    ),
                    onClick: logined ? onLogout : onLogin,
                    danger: logined ? true : false,
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
        <ConnectionStatus />
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
