import { HttpRequest, HttpRequestMethod, HttpHeader, } from "@minecraft/server-net";
import { http } from "@minecraft/server-net";
export default class httpReq {
    /**
     * Creates and sends an HTTP request
     * @param options - Request options
     * @returns Promise that resolves to the response
     */
    static async request(options) {
        const { url, method = "GET", body = null, headers = {} } = options;
        if (!url) {
            throw new Error("URL is required");
        }
        const request = new HttpRequest(url);
        switch (method.toUpperCase()) {
            case "GET":
                request.method = HttpRequestMethod.Get;
                break;
            case "POST":
                request.method = HttpRequestMethod.Post;
                break;
            case "PUT":
                request.method = HttpRequestMethod.Put;
                break;
            case "DELETE":
                request.method = HttpRequestMethod.Delete;
                break;
            case "HEAD":
                request.method = HttpRequestMethod.Head;
                break;
            default:
                request.method = HttpRequestMethod.Get;
        }
        if (body) {
            request.body = typeof body === "object" ? JSON.stringify(body) : body;
        }
        if (Object.keys(headers).length > 0) {
            request.headers = Object.entries(headers).map(([key, value]) => new HttpHeader(key, value));
        }
        try {
            const response = await http.request(request);
            return {
                status: response.status,
                body: response.body,
                headers: response.headers,
            };
        }
        catch (error) {
            throw new Error(`HTTP Request failed: ${error.message}`);
        }
    }
    static async get(url, options = {}) {
        return this.request({
            url,
            method: "GET",
            headers: options.headers || {},
        });
    }
    static async post(url, body, options = {}) {
        return this.request({
            url,
            method: "POST",
            body,
            headers: options.headers || {},
        });
    }
    static async put(url, body, options = {}) {
        return this.request({
            url,
            method: "PUT",
            body,
            headers: options.headers || {},
        });
    }
    static async delete(url, options = {}) {
        return this.request({
            url,
            method: "DELETE",
            body: options.body || null,
            headers: options.headers || {},
        });
    }
}
