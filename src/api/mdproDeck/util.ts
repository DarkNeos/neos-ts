export function mdproHeaders(): Headers {
  const myHeaders = new Headers();
  myHeaders.append("ReqSource", "MDPro3");

  return myHeaders;
}
