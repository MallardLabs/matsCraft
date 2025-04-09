import {
  HttpRequest,
  HttpRequestMethod,
  HttpHeader,
} from "@minecraft/server-net";
import { http } from "@minecraft/server-net";

export class httpReq {
  /**
   * Creates and sends an HTTP request
   * @param {Object} options - Request options
   * @param {string} options.url - URL endpoint
   * @param {string} [options.method="GET"] - HTTP method (GET, POST, PUT, DELETE, HEAD)
   * @param {Object|string} [options.body=null] - Request body
   * @param {Object} [options.headers={}] - Request headers
   * @returns {Promise<Object>} - Promise that resolves to the response
   */
  static async request(options) {
    // Default values
    const { url, method = "GET", body = null, headers = {} } = options;

    if (!url) {
      throw new Error("URL is required");
    }

    // Create request object
    const request = new HttpRequest(url);

    // Set HTTP method
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

    // Set body if provided
    if (body) {
      if (typeof body === "object") {
        request.body = JSON.stringify(body);
      } else {
        request.body = body;
      }
    }

    // Set headers
    if (Object.keys(headers).length > 0) {
      request.headers = Object.entries(headers).map(
        ([key, value]) => new HttpHeader(key, value)
      );
    }

    // Send request and return response
    try {
      const response = await http.request(request);
      return {
        status: response.status,
        body: response.body,
        headers: response.headers,
      };
    } catch (error) {
      throw new Error(`HTTP Request failed: ${error.message}`);
    }
  }

  /**
   * Shorthand for GET requests
   * @param {string} url - URL endpoint
   * @param {Object} [options={}] - Additional options (headers)
   * @returns {Promise<Object>} - Promise that resolves to the response
   */
  static async get(url, options = {}) {
    return this.request({
      url,
      method: "GET",
      headers: options.headers || {},
    });
  }

  /**
   * Shorthand for POST requests
   * @param {string} url - URL endpoint
   * @param {Object|string} body - Request body
   * @param {Object} [options={}] - Additional options (headers)
   * @returns {Promise<Object>} - Promise that resolves to the response
   */
  static async post(url, body, options = {}) {
    return this.request({
      url,
      method: "POST",
      body,
      headers: options.headers || {},
    });
  }

  /**
   * Shorthand for PUT requests
   * @param {string} url - URL endpoint
   * @param {Object|string} body - Request body
   * @param {Object} [options={}] - Additional options (headers)
   * @returns {Promise<Object>} - Promise that resolves to the response
   */
  static async put(url, body, options = {}) {
    return this.request({
      url,
      method: "PUT",
      body,
      headers: options.headers || {},
    });
  }

  /**
   * Shorthand for DELETE requests
   * @param {string} url - URL endpoint
   * @param {Object} [options={}] - Additional options (headers, body)
   * @returns {Promise<Object>} - Promise that resolves to the response
   */
  static async delete(url, options = {}) {
    return this.request({
      url,
      method: "DELETE",
      body: options.body || null,
      headers: options.headers || {},
    });
  }
}
