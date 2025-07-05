// httpReq.ts
import {
  HttpRequest,
  HttpHeader,
  HttpRequestMethod,
  http,
  HttpResponse,
} from "@minecraft/server-net";

type Method = "get" | "post" | "put" | "delete" | "head";

interface HttpReqConfig {
  method: Method;
  url: string;
  data?: unknown;
  headers?: Record<string, string>;
  timeout?: number;
}

function toHttpMethod(m: Method): HttpRequestMethod {
  switch (m) {
    case "get":
      return HttpRequestMethod.Get;
    case "post":
      return HttpRequestMethod.Post;
    case "put":
      return HttpRequestMethod.Put;
    case "delete":
      return HttpRequestMethod.Delete;
    case "head":
      return HttpRequestMethod.Head;
  }
}

export async function httpReq(config: HttpReqConfig): Promise<HttpResponse> {
  const { method, url, data, headers, timeout } = config;
  const req = new HttpRequest(url);
  req.setMethod(toHttpMethod(method));

  if (data !== undefined) {
    // Jika method GET/HEAD, ubah params URL? tapi di sini assume JSON body
    req.setBody(typeof data === "string" ? data : JSON.stringify(data));
    if (!headers || !("content-type" in headers)) {
      req.setHeaders([new HttpHeader("Content-Type", "application/json")]);
    }
  }

  if (headers) {
    const hdrs = Object.entries(headers).map(([k, v]) => new HttpHeader(k, v));
    req.setHeaders(hdrs);
  }

  if (timeout !== undefined) {
    req.setTimeout(timeout);
  }

  return await http.request(req);
}

// Shortcut methods
export const httpReqHelpers = {
  get: (url: string, headers?: Record<string, string>, timeout?: number) =>
    httpReq({ method: "get", url, headers, timeout }),
  post: (
    url: string,
    data?: unknown,
    headers?: Record<string, string>,
    timeout?: number
  ) => httpReq({ method: "post", url, data, headers, timeout }),
  put: (
    url: string,
    data?: unknown,
    headers?: Record<string, string>,
    timeout?: number
  ) => httpReq({ method: "put", url, data, headers, timeout }),
  delete: (url: string, headers?: Record<string, string>, timeout?: number) =>
    httpReq({ method: "delete", url, headers, timeout }),
  head: (url: string, headers?: Record<string, string>, timeout?: number) =>
    httpReq({ method: "head", url, headers, timeout }),
};
