// httpReq.ts
import { HttpRequest, HttpHeader, HttpRequestMethod, http, } from "@minecraft/server-net";
function toHttpMethod(m) {
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
export async function httpReq(config) {
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
    get: (url, headers, timeout) => httpReq({ method: "get", url, headers, timeout }),
    post: (url, data, headers, timeout) => httpReq({ method: "post", url, data, headers, timeout }),
    put: (url, data, headers, timeout) => httpReq({ method: "put", url, data, headers, timeout }),
    delete: (url, headers, timeout) => httpReq({ method: "delete", url, headers, timeout }),
    head: (url, headers, timeout) => httpReq({ method: "head", url, headers, timeout }),
};
