"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import LoginModal from "./LoginModal";
import { useAuth } from "../../contexts/AuthContext";

export default function Header() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isAdminPage = pathname?.startsWith("/admin");

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-transparent">
        <div className="flex items-center justify-end p-4 gap-3">
          {isAuthenticated && user ? (
            <>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/90 backdrop-blur-sm shadow-sm">
                <div className="w-8 h-8 rounded-full bg-[#D4C4B0] flex items-center justify-center">
                  <span className="text-sm font-medium text-[#5C4A37]">
                    {user.displayName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm text-[#5C4A37] font-medium">
                  {user.displayName}
                </span>
              </div>
              {isAdminPage ? (
                <button
                  onClick={() => router.push("/")}
                  className="px-6 py-2 rounded-lg bg-[#D4C4B0] text-[#5C4A37] font-medium hover:bg-[#C9B8A3] transition-colors shadow-sm"
                >
                  Home
                </button>
              ) : (
                <button
                  onClick={logout}
                  className="px-6 py-2 rounded-lg bg-[#D4C4B0] text-[#5C4A37] font-medium hover:bg-[#C9B8A3] transition-colors shadow-sm"
                >
                  Logout
                </button>
              )}
            </>
          ) : (
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="px-6 py-2 rounded-lg bg-[#D4C4B0] text-[#5C4A37] font-medium hover:bg-[#C9B8A3] transition-colors shadow-sm"
            >
              Login
            </button>
          )}
        </div>
      </header>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </>
  );
}
