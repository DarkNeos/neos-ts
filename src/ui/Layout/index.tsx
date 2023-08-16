import { Avatar } from "antd";
import classNames from "classnames";
import React, { useEffect } from "react";
import {
  type LoaderFunction,
  NavLink,
  Outlet,
  useLocation,
} from "react-router-dom";
import { useSnapshot } from "valtio";

import { forbidden } from "@/api";
import { useConfig } from "@/config";
import { accountStore } from "@/stores";

import styles from "./index.module.scss";
import {
  getLoginStatus,
  handleSSOLogin,
  initDeck,
  initSqlite,
  initWASM,
} from "./utils";

const NeosConfig = useConfig();

export const loader: LoaderFunction = async () => {
  getLoginStatus();
  initDeck();
  initSqlite();
  initWASM();
  forbidden.init();
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
  // 捕获SSO登录
  const location = useLocation();
  useEffect(() => {
    location.search && handleSSOLogin(location.search);
  }, [location.search]);

  // 根据是否登录，显示内容
  const logined = Boolean(useSnapshot(accountStore).user);

  const { pathname } = useLocation();
  const pathnamesHideHeader = ["/waitroom", "/duel"];
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

          <HeaderBtn to="/">主页</HeaderBtn>
          <HeaderBtn to="/match" disabled={!logined}>
            匹配
          </HeaderBtn>
          <HeaderBtn to="/build" disabled={!logined}>
            组卡
          </HeaderBtn>
          <span style={{ flexGrow: 1 }} />
          <span className={styles.profile}>
            <NeosAvatar />
            {/*暂时跳转到萌卡的profile页面*/}
            <HeaderBtn to={NeosConfig.profileUrl} disabled={!logined}>
              个人中心
            </HeaderBtn>
            <HeaderBtn to="https://ygobbs.com">萌卡社区</HeaderBtn>
            <HeaderBtn to="https://mycard.moe/ygopro/arena/#/">
              决斗数据库
            </HeaderBtn>
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
  return <Avatar size="small" src={user?.avatar_url} />;
};
