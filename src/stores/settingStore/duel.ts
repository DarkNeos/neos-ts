import { ChainSetting } from "../matStore/types";

export interface DuelConfig {
  initialChain: ChainSetting;
  fieldArtwork: boolean;
}

export const defaultDuelConfig: DuelConfig = {
  initialChain: ChainSetting.CHAIN_SMART,
  fieldArtwork: true,
};
