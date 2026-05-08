import { test as baseTest, expect, type APIRequestContext } from '@playwright/test';
import { config } from '../config';

const BASE_URL = config.api.baseUrl;

class Api {
  private pathValue = '';
  private bodyValue: unknown;
  private paramsValue: Record<string, string> = {};
  private authToken?: string;

  constructor(private requestContext: APIRequestContext) {}

  /**
   * Set the request path for the next API call.
   */
  path(path: string) {
    this.pathValue = path;
    return this;
  }

  /**
   * Attach a request payload for POST/PUT calls.
   */
  body(body: unknown) {
    this.bodyValue = body;
    return this;
  }

  /**
   * Attach query parameters to the next request.
   */
  params(params: Record<string, string>) {
    this.paramsValue = params;
    return this;
  }

  /**
   * Set the authorization token for authenticated requests.
   */
  auth(token: string) {
    this.authToken = token;
    return this;
  }

  /**
   * Build the full request URL from the configured path.
   */
  private buildUrl() {
    if (this.pathValue.startsWith('http')) {
      return this.pathValue;
    }
    // Remove trailing slash from BASE_URL if path starts with /
    const baseUrl = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
    return `${baseUrl}${this.pathValue}`;
  }

  /**
   * Build request options including headers, query params, and body data.
   */
  private buildOptions(method: string) {
    const headers: Record<string, string> = {};
    if (this.bodyValue !== undefined && method !== 'GET' && method !== 'DELETE') {
      headers['Content-Type'] = 'application/json';
    }
    if (this.authToken) {
      headers.Authorization = this.authToken;
    }

    const options: Record<string, unknown> = { headers };
    if (Object.keys(this.paramsValue).length) {
      options.params = this.paramsValue;
    }
    if (this.bodyValue !== undefined && method !== 'GET' && method !== 'DELETE') {
      // Playwright expects body data as a JSON string for POST/PUT
      options.data = JSON.stringify(this.bodyValue);
    }
    return options;
  }

  /**
   * Reset request builder state after each request.
   */
  private reset() {
    this.pathValue = '';
    this.bodyValue = undefined;
    this.paramsValue = {};
    return this;
  }

  /**
   * Perform a GET request and assert the expected status code.
   */
  async getRequest(expectedStatus: number) {
    const response = await this.requestContext.get(this.buildUrl(), this.buildOptions('GET'));
    expect(response.status()).toBe(expectedStatus);
    this.reset();
    return response;
  }

  /**
   * Perform a POST request and assert the expected status code.
   */
  async postRequest(expectedStatus: number) {
    const response = await this.requestContext.post(this.buildUrl(), this.buildOptions('POST'));
    expect(response.status()).toBe(expectedStatus);
    this.reset();
    return response;
  }

  /**
   * Perform a PUT request and assert the expected status code.
   */
  async putRequest(expectedStatus: number) {
    const response = await this.requestContext.put(this.buildUrl(), this.buildOptions('PUT'));
    expect(response.status()).toBe(expectedStatus);
    this.reset();
    return response;
  }

  /**
   * Perform a DELETE request and assert the expected status code.
   */
  async deleteRequest(expectedStatus: number) {
    const response = await this.requestContext.delete(this.buildUrl(), this.buildOptions('DELETE'));
    expect(response.status()).toBe(expectedStatus);
    this.reset();
    return response;
  }
}

/**
 * Export the test fixture with API helper.
 */
export const test = baseTest.extend<{ api: Api }>({
  api: async ({ request }, use) => {
    await use(new Api(request));
  },
});
