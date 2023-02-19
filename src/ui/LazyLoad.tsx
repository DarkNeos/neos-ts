import React, { Suspense } from "react";

// 这个组件不知道为啥用不了，先保留后面研究下
const LazyLoad = (props: { lazy: React.ReactNode }) => {
  return <Suspense fallback={<div>Loading...</div>}>{props.lazy}</Suspense>;
};

export const Loading = () => <div>Loading</div>;

export default LazyLoad;
