import { RightOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useSnapshot } from "valtio";

import { getSSOSignInUrl } from "@/api";
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
        <main className={styles.main}>
          <div className={styles.left}>
            <img
              className={styles["neos-logo"]}
              src={`${NeosConfig.assetsPath}/neos-logo.svg`}
              alt="YGO NEOS"
            />
            <div className={styles.title}>游戏王网页端对战平台</div>
            <div className={styles.keywords}>开源、免费、轻量级</div>
            <div className={styles.details}>
              Neos是一个开源的游戏王网页端对战平台。在Neos中，你可以组建卡组，创建房间，邀请好友进行对战。目前，Neos已经实现了与来自YGOpro、YGOpro2、YGOmobile和KoishiPro等平台的玩家进行对战的功能，而今后更多客户端也将得到支持。
            </div>
            <LoginBtn logined={Boolean(user)} />
          </div>
          <div className={styles.right}>
            <img
              className={styles["neos-main-bg"]}
              src={`${NeosConfig.assetsPath}/neos-main-bg.webp`}
            />
            <img
              className={styles["neos-main"]}
              src={`${NeosConfig.assetsPath}/neos-main.webp`}
            />
          </div>
        </main>
      </div>
    </>
  );
};
Component.displayName = "Start";

const LoginBtn: React.FC<{ logined: boolean }> = ({ logined }) => {
  const navigate = useNavigate();

  const loginViaSSO = () =>
    // 跳转回match页
    location.replace(getSSOSignInUrl(`${location.origin}/match/`));

  const goToMatch = () => navigate("/match");

  return (
    <SpecialButton
      style={{ marginTop: "auto" }}
      onClick={logined ? goToMatch : loginViaSSO}
    >
      <span>{logined ? "开始游戏" : "登录游戏"}</span>
      <RightOutlined />
    </SpecialButton>
  );
};
