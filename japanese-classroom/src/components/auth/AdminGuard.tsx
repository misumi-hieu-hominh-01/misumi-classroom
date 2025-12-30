"use client";

import { ReactNode, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cookieUtils } from "../../utils/cookies";
import { authApi } from "../../api/auth-api";

interface AdminGuardProps {
  children: ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function checkAdminAccess() {
      try {
        // 1. Read cookie → get token
        const accessToken = cookieUtils.getAccessToken();
        if (!accessToken) {
          setError("not_authenticated");
          setIsLoading(false);
          return;
        }

        // 2. Verify token and query DB for role
        // API will verify token and query DB to get latest role
        const userInfo = await authApi.getUserInfo();

        // 3. Check if role is admin
        if (userInfo.role !== "admin") {
          setError("not_admin");
          setIsLoading(false);
          return;
        }

        setHasAccess(true);
        setIsLoading(false);
      } catch (err) {
        const error = err as { statusCode?: number; message?: string };
        if (error.statusCode === 401) {
          setError("not_authenticated");
        } else {
          setError("not_admin");
        }
        setIsLoading(false);
      }
    }

    checkAdminAccess();
  }, []);

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-b from-sky-200 to-blue-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-lg text-gray-700">
            Đang kiểm tra quyền truy cập...
          </p>
        </div>
      </div>
    );
  }

  if (error === "not_authenticated") {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-b from-red-50 to-red-100">
        <div className="text-center bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Không có quyền truy cập
          </h1>
          <p className="text-gray-600 mb-6">
            Bạn cần đăng nhập để truy cập trang này.
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 rounded-lg bg-[#D4C4B0] text-[#5C4A37] font-medium hover:bg-[#C9B8A3] transition-colors cursor-pointer"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  if (error === "not_admin" || !hasAccess) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-b from-red-50 to-red-100">
        <div className="text-center bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Không có quyền truy cập
          </h1>
          <p className="text-gray-600 mb-2">
            Trang này chỉ dành cho quản trị viên.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Tài khoản của bạn không có quyền truy cập trang quản trị.
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 rounded-lg bg-[#D4C4B0] text-[#5C4A37] font-medium hover:bg-[#C9B8A3] transition-colors cursor-pointer"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
