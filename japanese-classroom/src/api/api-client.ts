import { cookieUtils } from "../utils/cookies";
import type { ApiError } from "../types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async refreshAccessToken(): Promise<string | null> {
    const refreshToken = cookieUtils.getRefreshToken();
    if (!refreshToken) return null;

    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        cookieUtils.clearAll();
        return null;
      }

      const responseData = await response.json();
      // Handle wrapped response
      const data = responseData.data || responseData;
      cookieUtils.setAccessToken(data.accessToken);
      return data.accessToken;
    } catch {
      cookieUtils.clearAll();
      return null;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const accessToken = cookieUtils.getAccessToken();
    const url = `${this.baseURL}${endpoint}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    let response = await fetch(url, {
      ...options,
      headers,
    });

    // If 401, try to refresh token
    if (response.status === 401 && accessToken) {
      const newAccessToken = await this.refreshAccessToken();
      if (newAccessToken) {
        // Retry request with new token
        headers["Authorization"] = `Bearer ${newAccessToken}`;
        response = await fetch(url, {
          ...options,
          headers,
        });
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: response.statusText,
        statusCode: response.status,
      }));
      throw {
        message: errorData.message || "An error occurred",
        statusCode: response.status,
        error: errorData.error,
      } as ApiError;
    }

    return response.json();
  }

  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  async post<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestInit
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestInit
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestInit
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
