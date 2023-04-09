import { useEnv } from "@/hook";
import NeosDevConfig from "../../neos.config.json";
import NeosProdConfig from "../../neos.config.prod.json";

const { DEV } = useEnv();

type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y
  ? 1
  : 2
  ? true
  : false;

type Expect<T extends true> = T;

/**
 * 确保两个json文件的结构一致，不一致会报错
 */
type _ = Expect<Equal<typeof NeosDevConfig, typeof NeosProdConfig>>;

export const envConfig = DEV ? NeosDevConfig : NeosProdConfig;
