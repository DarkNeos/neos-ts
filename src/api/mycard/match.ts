const API_URL = "https://sapi.moecube.com:444/ygopro/match";

export interface MatchInfo {
  address: string;
  port: number;
  password: string;
}

export async function match(
  username: string,
  extraId: number,
  arena: string = "entertain",
): Promise<MatchInfo | undefined> {
  const headers = { Authorization: "Basic " + btoa(username + ":" + extraId) };
  let response: Response | undefined = undefined;
  const params = new URLSearchParams({
    arena,
    // TODO: locale?
  });

  try {
    const resp = await fetch(API_URL + "?" + params.toString(), {
      method: "POST",
      headers: headers,
    });

    if (resp.ok) {
      response = resp;
    } else {
      console.error(`match error: ${resp.status}`);
    }
  } catch (error) {
    console.error(`match error: ${error}`);
  }

  return (await response?.json()) as MatchInfo;
}
