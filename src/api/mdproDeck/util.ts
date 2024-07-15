export function mdproHeaders(): Headers {
  const myHeaders = new Headers();
  myHeaders.append("ReqSource", "MDPro3");
  myHeaders.append("ClientSource", "Web");

  return myHeaders;
}
