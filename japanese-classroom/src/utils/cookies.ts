import Cookies from "js-cookie";

const COOKIE_OPTIONS = {
  expires: 7, // 7 days
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
};

export const cookieUtils = {
  setAccessToken(token: string) {
    Cookies.set("accessToken", token, COOKIE_OPTIONS);
  },

  getAccessToken(): string | undefined {
    return Cookies.get("accessToken");
  },

  setRefreshToken(token: string) {
    Cookies.set("refreshToken", token, COOKIE_OPTIONS);
  },

  getRefreshToken(): string | undefined {
    return Cookies.get("refreshToken");
  },

  setUser(user: unknown) {
    Cookies.set("user", JSON.stringify(user), COOKIE_OPTIONS);
  },

  getUser(): unknown | null {
    const userStr = Cookies.get("user");
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  clearAll() {
    Cookies.remove("accessToken");
    Cookies.remove("refreshToken");
    Cookies.remove("user");
  },
};
