// 录像临时演出状态不写入用户设置，也不依赖界面是否已经挂载。
export const replayPresentation = { seeking: false, speed: 1 };

export const replayDuration = (duration: number) =>
  replayPresentation.seeking ? 0 : duration / replayPresentation.speed;
