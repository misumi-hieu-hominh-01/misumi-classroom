"use client";

import { useState } from "react";
import { AdminGuard } from "../../../components/auth/AdminGuard";
import { Header } from "../../../components/ui";
import { ContentTab } from "../../../components/admin/content-tab";
import { Breadcrumb } from "../../../components/admin/breadcrumb";

export default function ContentManagementPage() {
  const [activeTab, setActiveTab] = useState<"vocab" | "kanji" | "grammar">(
    "vocab"
  );

  return (
    <AdminGuard>
      <main className="w-full min-h-screen bg-gradient-to-b from-sky-200 to-blue-100">
        <Header />
        <div className="pt-20 px-4 pb-8">
          <div className="max-w-7xl mx-auto">
            <Breadcrumb
              items={[
                { label: "Admin", href: "/admin" },
                { label: "Quản lý nội dung" },
              ]}
            />
            <h1 className="text-3xl font-bold text-[#5C4A37] mb-6">
              Quản lý nội dung
            </h1>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="border-b border-gray-200 mb-6">
                <nav className="flex space-x-4">
                  <button
                    onClick={() => setActiveTab("vocab")}
                    className={`px-4 py-2 font-medium transition-colors ${
                      activeTab === "vocab"
                        ? "text-[#5C4A37] border-b-2 border-[#5C4A37]"
                        : "text-gray-600 hover:text-[#5C4A37]"
                    }`}
                  >
                    Từ vựng
                  </button>
                  <button
                    onClick={() => setActiveTab("kanji")}
                    className={`px-4 py-2 font-medium transition-colors ${
                      activeTab === "kanji"
                        ? "text-[#5C4A37] border-b-2 border-[#5C4A37]"
                        : "text-gray-600 hover:text-[#5C4A37]"
                    }`}
                  >
                    Kanji
                  </button>
                  <button
                    onClick={() => setActiveTab("grammar")}
                    className={`px-4 py-2 font-medium transition-colors ${
                      activeTab === "grammar"
                        ? "text-[#5C4A37] border-b-2 border-[#5C4A37]"
                        : "text-gray-600 hover:text-[#5C4A37]"
                    }`}
                  >
                    Ngữ pháp
                  </button>
                </nav>
              </div>

              <ContentTab type={activeTab} />
            </div>
          </div>
        </div>
      </main>
    </AdminGuard>
  );
}
