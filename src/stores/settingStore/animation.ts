export interface AnimationConfig {
  // 界面与对局动画统一由此开关控制，不跟随系统的减少动态效果设置。
  enabled: boolean;
  // custom speed set by player
  speed: number;
}

export const defaultAnimationConfig: AnimationConfig = {
  enabled: true,
  speed: 0.7,
};
