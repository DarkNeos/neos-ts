/**
 * @description 将 vite 的原始环境变量转成正确的类型
 * @returns 转换成正确类型的 vite 环境变量
 */
export const useEnv = (): ImportMetaEnv => {
  const env = import.meta.env;
  const ret: any = {};

  Object.keys(env).forEach((envKey) => {
    // 转成正确的布尔类型
    ret[envKey] =
      env[envKey] === "true"
        ? true
        : env[envKey] === "false"
        ? false
        : env[envKey];
  });

  return ret;
};
