import "./Desc.scss";

import { Fragment } from "react";

export const Desc: React.FC<{ desc?: string }> = ({ desc = "" }) => {
  if (!desc) return <></>;
  return (
    <div className="card-modal-desc">
      {/* https://125naroom.com/web/2877 */}
      {/* 牛逼的丸文字css教程 */}
      <RegexWrapper
        text={addSpaces(desc)}
        re={/(①|②|③|④|⑤|⑥|⑦|⑧|⑨|⑩)：.+?(?=((①|②|③|④|⑤|⑥|⑦|⑧|⑨|⑩)：|$))/gs}
        Wrapper={MaroListItem}
      />
    </div>
  );
};

const RegexWrapper: React.FC<{
  text: string;
  re: RegExp;
  Wrapper: React.FunctionComponent<any>;
}> = ({ text, re, Wrapper }) => {
  const matches = text.match(re);
  if (!matches) return <>{text}</>;
  const sepRe = new RegExp(
    matches?.reduce((acc, cur) => `${acc}|${cur}`) ?? ""
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
    <div className="maro-item">
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
    <div className="maro-item">
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
