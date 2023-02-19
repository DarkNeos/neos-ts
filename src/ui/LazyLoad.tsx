import React, { Suspense } from "react";

const LazyLoad = (props: { lazy: React.ReactNode }) => {
  return <Suspense fallback={<div>Loading...</div>}>{props.lazy}</Suspense>;
};

export default LazyLoad;
