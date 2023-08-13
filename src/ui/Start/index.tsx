import { RightOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useSnapshot } from "valtio";

import { useConfig } from "@/config";
import { accountStore } from "@/stores";
import { Background, SpecialButton } from "@/ui/Shared";

import styles from "./index.module.scss";

const NeosConfig = useConfig();

export const Component: React.FC = () => {
  const { user } = useSnapshot(accountStore);
  return (
    <>
      <Background />
      <div className={styles.wrap}>
        <div className={styles["particles-container"]}>
          {Array.from({ length: 100 }).map((_, key) => (
            <div key={key} className={styles["particle-container"]}>
              <div className={styles["particle"]} />
            </div>
          ))}
        </div>
        <main className={styles["main"]}>
          <img
            className={styles["neos-logo"]}
            src={`${NeosConfig.assetsPath}/neos-logo.svg`}
            alt="YGO NEOS"
          />
          <img
            className={styles["neos-pic"]}
            src={`${NeosConfig.assetsPath}/neos.png`}
            alt="neos"
          />
        </main>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <LoginBtn logined={Boolean(user)} />
        </div>
      </div>
    </>
  );
};
Component.displayName = "Start";

const LoginBtn: React.FC<{ logined: boolean }> = ({ logined }) => {
  const navigate = useNavigate();

  const loginViaSSO = () =>
    // 跳转回match页
    location.replace(getSSOUrl(`${location.origin}/match/}`));

  const goToMatch = () => navigate("/match");

  return (
    <SpecialButton onClick={logined ? goToMatch : loginViaSSO}>
      <span>{logined ? "开始游戏" : "登录游戏"}</span>
      <RightOutlined />
    </SpecialButton>
  );
};

/** 构建一个单点登录（Single Sign-On，简称SSO）的URL */
function getSSOUrl(callbackUrl: string): string {
  const params = new URLSearchParams({
    sso: btoa(new URLSearchParams({ return_sso_url: callbackUrl }).toString()),
  });

  const url = new URL(NeosConfig.accountUrl);
  url.search = params.toString();

  return url.toString();
}
