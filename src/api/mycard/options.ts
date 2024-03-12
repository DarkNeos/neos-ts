/* MC服房间的选项 */

export interface Options {
  mode: number;
  rule: number;
  start_lp: number;
  start_lp_tag: number;
  start_hand: number;
  draw_count: number;
  duel_rule: number;
  no_check_deck: boolean;
  no_shuffle_deck: boolean;
  lflist?: number;
  time_limit?: number;
  auto_death: boolean;
}

export const defaultOptions: Options = {
  mode: 1,
  rule: 0,
  // rule: this.settingsService.getLocale().startsWith('zh') ? 0 : 1,
  start_lp: 8000,
  start_lp_tag: 16000,
  start_hand: 5,
  draw_count: 1,
  duel_rule: 5,
  no_check_deck: false,
  no_shuffle_deck: false,
  lflist: 0,
  time_limit: 180,
  auto_death: false,
};
