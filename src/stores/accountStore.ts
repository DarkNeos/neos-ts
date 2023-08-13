import { proxy } from "valtio";

import { type NeosStore } from "./shared";

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  token: string;
  external_id: number;
  avatar_url: string;
}

class AccountStore implements NeosStore {
  user?: User;
  login(user: User) {
    this.user = user;
  }
  logout() {
    this.user = undefined;
  }
  reset(): void {
    this.user = undefined;
  }
}

export const accountStore = proxy(new AccountStore());
