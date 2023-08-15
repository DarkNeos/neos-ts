/** 在fetch的基础上，封装一个pfetch。增加一个可选的新参数，这个参数是一个回调函数，从而让外界可以感知fetch的进度(0->1)，比如下载进度。 */
export async function pfetch(
  input: RequestInfo,
  options?: {
    init?: RequestInit;
    progressCallback?: (progress: number) => void;
  },
): Promise<Response> {
  const response = await fetch(input, options?.init);
  const clonedResponse = response.clone(); // Clone the response to create a new body stream

  if (typeof options?.progressCallback === "function") {
    const contentLength = parseInt(
      response.headers.get("content-length") || "0",
      10,
    );
    let bytesRead = 0;

    const reader = clonedResponse.body!.getReader();

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      bytesRead += value.length;
      const progress = (bytesRead / contentLength) * 100;
      options?.progressCallback(progress);
    }
  }

  return response;
}
