import { Fragment, useMemo } from "react";

import styles from "./index.module.scss";

export const CardEffectText: React.FC<{ desc?: string }> = ({ desc = "" }) => {
  if (!desc) return <></>;
  const preprocessedDesc = useMemo(() => {
    return addSpaces(desc);
  }, [desc]);
  return (
    <div className={styles.desc}>
      <RegexWrapper
        text={preprocessedDesc}
        re={/(①|②|③|④|⑤|⑥|⑦|⑧|⑨|⑩)：.+?(?=((①|②|③|④|⑤|⑥|⑦|⑧|⑨|⑩)：|$))/gs}
        Wrapper={MaroListItem}
      />
    </div>
  );
};

/** 使用re去提取文本，并且将提取到的文本用Wrapper进行环绕 */
const RegexWrapper: React.FC<{
  text: string;
  re: RegExp;
  Wrapper: React.FunctionComponent<any>;
}> = ({ text, re, Wrapper }) => {
  const matches = text.match(re);
  if (!matches) return <>{text}</>;
  const sepRe = new RegExp(
    matches?.reduce((acc, cur) => `${acc}|${cur}`) ?? "",
  );
  const parts = text.split(sepRe);
  return (
    <>
      {parts.map((part, index) => (
        <Fragment key={`${part}-${index}`}>
          <div>{part}</div>
          {index !== parts.length - 1 && <Wrapper>{matches?.[index]}</Wrapper>}
        </Fragment>
      ))}
    </>
  );
};

const MaroListItem: React.FC<{ children: string }> = ({ children }) => {
  return (
    <div className={styles["maro-item"]}>
      <span>{children[0]}</span>
      <span>
        <RegexWrapper
          text={children.slice(2)}
          re={/●.+?(?=(●|$))/gs}
          Wrapper={CircleListItem}
        />
      </span>
    </div>
  );
};

const CircleListItem: React.FC<{ children: string }> = ({ children }) => {
  return children ? (
    <div className={styles["maro-item"]}>
      <span>{children[0]}</span>
      <span>{children.slice(1)}</span>
    </div>
  ) : (
    <></>
  );
};

function addSpaces(str: string): string {
  const regex = /\d+/g;
  return str.replace(regex, (match) => ` ${match} `);
}

// function removePendulumPrefix(str: string): string {}
