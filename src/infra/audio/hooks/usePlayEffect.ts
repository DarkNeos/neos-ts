import { useEffect, useRef } from "react";

import { AudioActionType, playEffect } from "@/infra/audio";

export function usePlayEffect<T extends HTMLElement>(effect: AudioActionType) {
  const effectRef = useRef<T | null>(null);

  useEffect(() => {
    const handleClick = () => {
      playEffect(effect);
    };
    effectRef.current?.addEventListener("click", handleClick);
    return () => {
      effectRef.current?.removeEventListener("click", handleClick);
    };
  }, [playEffect]);

  // 留一些扩展性，并且方便修改引用 key
  return [effectRef] as const;
}
