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
            <div className={styles.title}>游戏王网页对战模拟器</div>
            <div className={styles.keywords}>开源、免费、轻量级</div>
            <div className={styles.details}>
              这是有关Neos的详细介绍。观夫明堂之宏壮也，则突兀瞳曨，乍明乍蒙，若大古元气之结空。巃嵸颓沓，若嵬若嶪，似天阃地门之开阖。尔乃划岝峉以岳立，郁穹崇而鸿纷。冠百王而垂勋，烛万象而腾文。
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
