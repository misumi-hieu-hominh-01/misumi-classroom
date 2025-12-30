"use client";

import { useRouter } from "next/navigation";
import { AdminGuard } from "../../components/auth/AdminGuard";
import { Header } from "../../components/ui";

export default function AdminPage() {
  const router = useRouter();

  return (
    <AdminGuard>
      <main className="w-full min-h-screen bg-gradient-to-b from-sky-200 to-blue-100">
        <Header />
        <div className="pt-20 px-4 pb-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-[#5C4A37] mb-4">
                Hello Admin
              </h1>
              <p className="text-lg text-[#8B7355]">
                Chào mừng đến với trang quản trị
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                onClick={() => router.push("/admin/content")}
                className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow text-left group cursor-pointer"
              >
                <div className="text-4xl mb-4">📚</div>
                <h2 className="text-xl font-bold text-[#5C4A37] mb-2 group-hover:text-[#8B7355] transition-colors">
                  Quản lý nội dung
                </h2>
                <p className="text-gray-600">
                  Quản lý từ vựng, kanji, ngữ pháp và upload hàng loạt từ Excel
                </p>
              </button>

              <button
                onClick={() => router.push("/admin/users")}
                className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow text-left group cursor-pointer"
              >
                <div className="text-4xl mb-4">👥</div>
                <h2 className="text-xl font-bold text-[#5C4A37] mb-2 group-hover:text-[#8B7355] transition-colors">
                  Quản lý người dùng
                </h2>
                <p className="text-gray-600">
                  Quản lý ngày bắt đầu khóa học cho từng người dùng
                </p>
              </button>

              <button
                onClick={() => router.push("/admin/settings")}
                className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow text-left group cursor-pointer"
              >
                <div className="text-4xl mb-4">⚙️</div>
                <h2 className="text-xl font-bold text-[#5C4A37] mb-2 group-hover:text-[#8B7355] transition-colors">
                  Cài đặt
                </h2>
                <p className="text-gray-600">
                  Cài đặt giới hạn học tập hàng ngày cho tất cả người dùng
                </p>
              </button>
            </div>
          </div>
        </div>
      </main>
    </AdminGuard>
  );
}
