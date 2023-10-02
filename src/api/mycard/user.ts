import { useConfig } from "@/config";
const { userApi } = useConfig();

interface WrappedUserInfo {
  user: UserInfo;
}

export interface UserInfo {
  id: number;
  username: string;
  name: string;
  email: string;
  active: boolean;
  admin: boolean;
  avatar: string;
  locale: string;
}

export async function getUserInfo(
  username: string,
): Promise<UserInfo | undefined> {
  const resp = await fetch(userApi.replace("{username}", username));

  if (resp.ok) {
    return ((await resp.json()) as WrappedUserInfo).user;
  } else {
    console.error(`get ${username} info error`);
    return undefined;
  }
}
