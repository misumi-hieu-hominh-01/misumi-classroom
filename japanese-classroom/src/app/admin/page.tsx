"use client";

import { AdminGuard } from "../../components/auth/AdminGuard";
import { Header } from "../../components/ui";

export default function AdminPage() {
  return (
    <AdminGuard>
      <main className="w-full h-screen overflow-hidden bg-gradient-to-b from-sky-200 to-blue-100">
        <Header />
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-[#5C4A37] mb-4">
              Hello Admin
            </h1>
            <p className="text-lg text-[#8B7355]">
              Chào mừng đến với trang quản trị
            </p>
          </div>
        </div>
      </main>
    </AdminGuard>
  );
}
