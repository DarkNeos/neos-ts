import { useEffect } from "react";
import { useRouteError } from "react-router-dom";

export function RouteError() {
  const error = useRouteError();
  const isHome = window.location.pathname === "/";

  useEffect(() => {
    console.error("页面加载失败", error);
    if (!isHome) {
      // 重新加载以清理失效的对局状态，并替换历史记录中的错误页面。
      window.location.replace("/");
    }
  }, [error, isHome]);

  return (
    <main role="alert" style={{ padding: "2rem" }}>
      <h1>页面加载失败</h1>
      <p>{isHome ? "请重新加载页面后再试。" : "正在返回首页…"}</p>
      <a href="/">{isHome ? "重新加载" : "返回首页"}</a>
    </main>
  );
}
