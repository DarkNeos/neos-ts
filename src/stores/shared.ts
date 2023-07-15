// Neos项目中所有Store需要实现的接口
// 用于统一管理状态的初始化和重置
export interface NeosStore {
  reset(): void;
}
